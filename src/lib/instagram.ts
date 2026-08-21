/**
 * Instagram Graph API publishing (Reels / feed video).
 *
 * Requirements on Meta's side:
 *  - Instagram Business/Creator account linked to a Facebook Page
 *  - Meta app with `instagram_basic`, `instagram_content_publish`,
 *    `pages_show_list`, `pages_read_engagement`
 *
 * Env:
 *   INSTAGRAM_CLIENT_ID / INSTAGRAM_CLIENT_SECRET (Meta app id + secret)
 *   INSTAGRAM_REDIRECT_URI (defaults to <APP_URL>/api/social/callback/instagram)
 * Without them the platform runs in offline/demo mode like YouTube/LinkedIn.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export const INSTAGRAM_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
];

export function instagramConfig() {
  return {
    clientId: process.env.INSTAGRAM_CLIENT_ID || "",
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
    redirectUri:
      process.env.INSTAGRAM_REDIRECT_URI ||
      `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/social/callback/instagram`,
  };
}

export function instagramConfigured(): boolean {
  const c = instagramConfig();
  return Boolean(c.clientId && c.clientSecret && c.redirectUri);
}

export function instagramAuthUrl(state = "vf"): string {
  const c = instagramConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function instagramExchangeCode(code: string) {
  const c = instagramConfig();
  const params = new URLSearchParams({
    code,
    client_id: c.clientId,
    client_secret: c.clientSecret,
    redirect_uri: c.redirectUri,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Instagram token exchange failed (${res.status})`);
  const short: any = await res.json();

  // Exchange short-lived (~1h) for long-lived (~60d) token.
  const ext = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${c.clientId}&client_secret=${c.clientSecret}&fb_exchange_token=${short.access_token}`,
    { signal: AbortSignal.timeout(15_000) }
  );
  if (!ext.ok) return { accessToken: String(short.access_token), expiresIn: Number(short.expires_in || 3600) };
  const long: any = await ext.json();
  return { accessToken: String(long.access_token), expiresIn: Number(long.expires_in || 5_184_000) };
}

/** Finds the IG user id behind the authorized Facebook accounts. */
export async function instagramAccount(token: string) {
  const res = await fetch(`${GRAPH}/me/accounts?fields=instagram_business_account{id,username},name&access_token=${token}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Instagram account lookup failed (${res.status})`);
  const json: any = await res.json();
  const page = json?.data?.find((p: any) => p.instagram_business_account);
  if (!page) throw new Error("No Instagram Business account linked to your Facebook pages");
  return {
    externalId: String(page.instagram_business_account.id),
    name: `@${page.instagram_business_account.username || page.name || "instagram"}`,
  };
}

/**
 * Publishes a reel/feed video: create a media container from a public video
 * URL, poll until it finishes processing, then publish it.
 */
export async function instagramPublish(opts: {
  token: string;
  igUserId: string;
  title: string;
  description: string;
  videoUrl: string;
}): Promise<{ postId: string; permalink: string }> {
  const caption = `${opts.title}\n\n${opts.description}`.slice(0, 2200);

  const createRes = await fetch(`${GRAPH}/${opts.igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: opts.videoUrl,
      caption,
      share_to_feed: true,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!createRes.ok) {
    const detail = await createRes.text().catch(() => "");
    throw new Error(`Instagram container failed (${createRes.status}) ${detail.slice(0, 160)}`);
  }
  const creationId = String((await createRes.json())?.id || "");
  if (!creationId) throw new Error("Instagram returned no container id");

  // Containers need time to transcode; poll up to ~90s.
  let ready = false;
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${opts.token}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (statusRes.ok) {
      const code = (await statusRes.json())?.status_code;
      if (code === "FINISHED") {
        ready = true;
        break;
      }
      if (code === "ERROR" || code === "EXPIRED") throw new Error(`Instagram media ${code}`);
    }
  }
  if (!ready) throw new Error("Instagram media processing timed out");

  const pubRes = await fetch(`${GRAPH}/${opts.igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!pubRes.ok) {
    const detail = await pubRes.text().catch(() => "");
    throw new Error(`Instagram publish failed (${pubRes.status}) ${detail.slice(0, 160)}`);
  }
  const mediaId = String((await pubRes.json())?.id || "");
  return { postId: mediaId || creationId, permalink: `https://www.instagram.com/reel/${mediaId || creationId}/` };
}

/** Plays/likes/comments where available; null → caller falls back offline. */
export async function instagramInsights(
  token: string,
  mediaId: string
): Promise<{ views: number; likes: number; comments: number } | null> {
  try {
    const res = await fetch(
      `${GRAPH}/${mediaId}?fields=like_count,comments_count,play_count&access_token=${token}`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) return null;
    const json: any = await res.json();
    if (json?.error) return null;
    return {
      views: Number(json.play_count || 0),
      likes: Number(json.like_count || 0),
      comments: Number(json.comments_count || 0),
    };
  } catch {
    return null;
  }
}

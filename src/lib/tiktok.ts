/**
 * TikTok Content Posting API (direct post, pull-from-URL).
 *
 * Env:
 *   TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET (from the TikTok developer app)
 *   TIKTOK_REDIRECT_URI (defaults to <APP_URL>/api/social/callback/tiktok)
 * Scopes needed on the app: user.info.basic, video.publish
 *
 * Without credentials the platform runs in offline/demo mode.
 */

const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

export const TIKTOK_SCOPES = ["user.info.basic", "video.publish"];

export function tiktokConfig() {
  return {
    clientKey: process.env.TIKTOK_CLIENT_KEY || "",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
    redirectUri:
      process.env.TIKTOK_REDIRECT_URI ||
      `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/social/callback/tiktok`,
  };
}

export function tiktokConfigured(): boolean {
  const c = tiktokConfig();
  return Boolean(c.clientKey && c.clientSecret && c.redirectUri);
}

export function tiktokAuthUrl(state = "vf"): string {
  const c = tiktokConfig();
  const params = new URLSearchParams({
    client_key: c.clientKey,
    response_type: "code",
    redirect_uri: c.redirectUri,
    scope: TIKTOK_SCOPES.join(","),
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function tiktokExchangeCode(code: string) {
  const c = tiktokConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_key: c.clientKey,
      client_secret: c.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: c.redirectUri,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed (${res.status})`);
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number; open_id: string };
}

/**
 * Direct-post a video by public URL. TikTok fetches it from their side, so no
 * binary upload happens here. Returns a publish id used to track status.
 */
export async function tiktokPublish(opts: {
  token: string;
  title: string;
  videoUrl: string;
}): Promise<{ postId: string; permalink: string }> {
  const res = await fetch(INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: opts.title.slice(0, 2200),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: opts.videoUrl,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TikTok init failed (${res.status}) ${detail.slice(0, 160)}`);
  }
  const json: any = await res.json();
  const publishId = String(json?.data?.publish_id || "");
  if (!publishId) throw new Error("TikTok returned no publish id");
  // TikTok has no instant share URL; the profile hosts the final video.
  return { postId: publishId, permalink: `https://www.tiktok.com/@studio/video/${publishId}` };
}

/** Publish status + permanent link once TikTok finishes processing. */
export async function tiktokStatus(
  token: string,
  publishId: string
): Promise<{ status: string; permalink?: string }> {
  try {
    const res = await fetch(STATUS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { status: "unknown" };
    const json: any = await res.json();
    const status = String(json?.data?.status || "unknown");
    return { status, permalink: json?.data?.publicaly_available_post_id ? `https://www.tiktok.com/@studio/video/${json.data.publicaly_available_post_id}` : undefined };
  } catch {
    return { status: "unknown" };
  }
}

/**
 * LinkedIn integration (member + organization posting).
 *
 * Live mode requires a LinkedIn app (developer.linkedin.com) with the
 * "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect"
 * products enabled:
 *   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET,
 *   LINKEDIN_REDIRECT_URI (defaults to <APP_URL>/api/social/callback/linkedin)
 * Optional: LINKEDIN_ORGANIZATION_URN to post as a company page
 * (e.g. "urn:li:organization:123456") — requires r_organization_social.
 *
 * Without credentials the platform runs in demo/offline mode.
 */

const OAUTH_BASE = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const ME_URL = "https://api.linkedin.com/v2/userinfo";

export const LINKEDIN_SCOPES = ["openid", "profile", "w_member_social"];

export function linkedinConfig() {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID || "",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    redirectUri:
      process.env.LINKEDIN_REDIRECT_URI ||
      `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/social/callback/linkedin`,
    organizationUrn: process.env.LINKEDIN_ORGANIZATION_URN || "",
  };
}

/** True when real publishing through the LinkedIn API is available. */
export function linkedinConfigured(): boolean {
  const c = linkedinConfig();
  return Boolean(c.clientId && c.clientSecret && c.redirectUri);
}

export function linkedinAuthUrl(state = "vf"): string {
  const c = linkedinConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    state,
    scope: LINKEDIN_SCOPES.join(" "),
  });
  return `${OAUTH_BASE}?${params.toString()}`;
}

export async function linkedinExchangeCode(code: string) {
  const c = linkedinConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      redirect_uri: c.redirectUri,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed (${res.status})`);
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
}

export async function linkedinProfile(token: string) {
  const res = await fetch(ME_URL, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`LinkedIn profile lookup failed (${res.status})`);
  const json: any = await res.json();
  const name = [json?.given_name, json?.family_name].filter(Boolean).join(" ");
  return {
    externalId: String(json?.sub || ""),
    name: String(name || "LinkedIn member"),
  };
}

/**
 * Publishes a post as either the member or an organization.
 * The video URL is attached as a link-article media item (LinkedIn's API has
 * no simple direct binary video upload; native video requires the partner
 * video API). Returns the activity URN and a feed permalink.
 */
export async function linkedinPost(opts: {
  token: string;
  authorUrn: string; // urn:li:person:{sub} or urn:li:organization:{id}
  title: string;
  description: string;
  url?: string;
}): Promise<{ postId: string; permalink: string }> {
  const payload = {
    author: opts.authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: `${opts.title}\n\n${opts.description}`.slice(0, 3000) },
        shareMediaCategory: opts.url ? "ARTICLE" : "NONE",
        ...(opts.url
          ? {
              media: [
                {
                  status: "READY",
                  originalUrl: opts.url,
                  title: { text: opts.title.slice(0, 200) },
                },
              ],
            }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch(UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LinkedIn post failed (${res.status}) ${detail.slice(0, 200)}`);
  }
  const json: any = await res.json();
  const postId = String(json?.id || "");
  if (!postId) throw new Error("LinkedIn returned no post id");
  // Activity URNs (urn:li:share:... / urn:li:ugcPost:...) map 1:1 to feed URLs.
  return { postId, permalink: `https://www.linkedin.com/feed/update/${postId}` };
}

/**
 * Organization share statistics. Personal-profile analytics are not available
 * through the public API, so this returns null for member posts — the caller
 * falls back to its own tracking.
 */
export async function linkedinOrgStats(
  token: string,
  organizationUrn: string,
  postUrn: string
): Promise<{ views: number; likes: number; comments: number; shares: number } | null> {
  if (!organizationUrn.startsWith("urn:li:organization:")) return null;
  const params = new URLSearchParams({
    q: "organizationalEntityShareStatistics",
    organizationalEntity: organizationUrn,
    shares: postUrn.includes("urn:") ? postUrn : `urn:li:share:${postUrn}`,
  });
  const res = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }
  );
  if (!res.ok) return null;
  try {
    const json: any = await res.json();
    const t = json?.elements?.[0]?.totalShareStatistics;
    if (!t) return null;
    return {
      views: Number(t.impressionCount || 0),
      likes: Number(t.likeCount || 0),
      comments: Number(t.commentCount || 0),
      shares: Number(t.shareCount || 0),
    };
  } catch {
    return null;
  }
}

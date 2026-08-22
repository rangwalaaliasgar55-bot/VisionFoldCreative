/**
 * YouTube Data API v3 integration.
 *
 * Live mode requires an OAuth client (Google Cloud Console -> OAuth client,
 * type Web application):
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET,
 *   YOUTUBE_REDIRECT_URI (defaults to <APP_URL>/api/social/callback/youtube)
 * An optional YOUTUBE_API_KEY enables read-only public statistics without OAuth.
 *
 * When no credentials exist the rest of the app runs the platform in
 * demo/offline mode (see src/lib/social.ts) — nothing here throws.
 */

const OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3/videos";
const API_BASE = "https://www.googleapis.com/youtube/v3";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

import { runtimeKey } from "@/lib/runtimeKeys";

export function youtubeConfig() {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID || runtimeKey("youtube_client_id") || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || runtimeKey("youtube_client_secret") || "",
    redirectUri:
      process.env.YOUTUBE_REDIRECT_URI ||
      `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/social/callback/youtube`,
    apiKey: process.env.YOUTUBE_API_KEY || "",
  };
}

/** True when real publishing through the YouTube API is available. */
export function youtubeConfigured(): boolean {
  const c = youtubeConfig();
  return Boolean(c.clientId && c.clientSecret && c.redirectUri);
}

export function youtubeAuthUrl(state = "vf"): string {
  const c = youtubeConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: YOUTUBE_SCOPES.join(" "),
    state,
  });
  return `${OAUTH_BASE}?${params.toString()}`;
}

export async function youtubeExchangeCode(code: string) {
  const c = youtubeConfig();
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
  if (!res.ok) throw new Error(`YouTube token exchange failed (${res.status})`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function youtubeRefresh(refreshToken: string) {
  const c = youtubeConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`YouTube token refresh failed (${res.status})`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

/** Returns a valid access token, refreshing first when needed. */
export async function youtubeAccessToken(account: {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}): Promise<{ token: string; expiresIn: number; refreshToken: string } | null> {
  const stillValid =
    account.accessToken && account.expiresAt && account.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) {
    return {
      token: account.accessToken,
      expiresIn: Math.floor(((account.expiresAt as Date).getTime() - Date.now()) / 1000),
      refreshToken: account.refreshToken,
    };
  }
  if (!account.refreshToken) return null;
  const refreshed = await youtubeRefresh(account.refreshToken);
  return {
    token: refreshed.access_token,
    expiresIn: refreshed.expires_in,
    refreshToken: account.refreshToken,
  };
}

export async function youtubeChannel(token: string) {
  const res = await fetch(`${API_BASE}/channels?part=snippet&mine=true`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`YouTube channel lookup failed (${res.status})`);
  const json: any = await res.json();
  const item = json?.items?.[0];
  if (!item) throw new Error("No YouTube channel found for this Google account");
  return {
    externalId: String(item.id),
    name: String(item.snippet?.title || "YouTube channel"),
    thumbnail: String(item.snippet?.thumbnails?.default?.url || ""),
  };
}

/**
 * Uploads a video via the resumable upload endpoint. The video must be
 * reachable over HTTP(S) from the server (e.g. Supabase Storage / S3 / CDN).
 */
export async function youtubeUpload(opts: {
  token: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: "public" | "unlisted" | "private";
  videoUrl: string;
}): Promise<{ videoId: string; permalink: string }> {
  const metaRes = await fetch(opts.videoUrl, { method: "GET", signal: AbortSignal.timeout(60_000) });
  if (!metaRes.ok) throw new Error(`Could not download video source (${metaRes.status})`);
  const bytes = Buffer.from(await metaRes.arrayBuffer());
  if (bytes.length === 0) throw new Error("Video source is empty");

  const initRes = await fetch(`${UPLOAD_BASE}?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(bytes.length),
      "X-Upload-Content-Type": metaRes.headers.get("content-type") || "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: opts.title.slice(0, 100),
        description: opts.description.slice(0, 5000),
        tags: opts.tags.slice(0, 15),
        categoryId: "22", // People & Blogs — safe default for brand content
      },
      status: { privacyStatus: opts.privacyStatus || "public", selfDeclaredMadeForKids: false },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!initRes.ok) {
    const detail = await initRes.text().catch(() => "");
    throw new Error(`YouTube upload init failed (${initRes.status}) ${detail.slice(0, 200)}`);
  }
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube did not return an upload session URL");

  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Length": String(bytes.length), "Content-Type": "video/mp4" },
    body: new Uint8Array(bytes),
    // Large uploads need a generous window.
    signal: AbortSignal.timeout(300_000),
  });
  if (!upRes.ok) {
    const detail = await upRes.text().catch(() => "");
    throw new Error(`YouTube upload failed (${upRes.status}) ${detail.slice(0, 200)}`);
  }
  const json: any = await upRes.json();
  const videoId = String(json?.id || "");
  if (!videoId) throw new Error("YouTube upload returned no video id");
  return { videoId, permalink: `https://www.youtube.com/watch?v=${videoId}` };
}

export async function youtubeVideoStats(
  videoId: string,
  opts: { token?: string; apiKey?: string }
): Promise<{ views: number; likes: number; comments: number } | null> {
  const params = new URLSearchParams({ part: "statistics", id: videoId });
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  else if (opts.apiKey) params.set("key", opts.apiKey);
  else return null;

  const res = await fetch(`${API_BASE}/videos?${params.toString()}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const s = json?.items?.[0]?.statistics;
  if (!s) return null;
  return {
    views: Number(s.viewCount || 0),
    likes: Number(s.likeCount || 0),
    comments: Number(s.commentCount || 0),
  };
}

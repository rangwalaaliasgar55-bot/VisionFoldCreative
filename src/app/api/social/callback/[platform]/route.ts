import { db } from "@/db";
import { activity, socialAccounts } from "@/db/schema";
import { readSession } from "@/lib/auth";
import { linkedinExchangeCode, linkedinProfile } from "@/lib/linkedin";
import { instagramAccount, instagramExchangeCode } from "@/lib/instagram";
import { tiktokExchangeCode } from "@/lib/tiktok";
import { youtubeChannel, youtubeExchangeCode } from "@/lib/youtube";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * OAuth return URL for YouTube / LinkedIn connections.
 * The staff session cookie rides along on the redirect, so we can verify the
 * person completing the flow is a signed-in team member before storing tokens.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ platform: string }> }
) {
  const appUrl = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const redirect = (search: string) => NextResponse.redirect(`${appUrl}/admin/social${search}`);

  const session = await readSession();
  const isStaff = session && (session.role === "admin" || session.role === "editor");
  if (!isStaff) return redirect("?error=unauthorized");

  const { platform } = await ctx.params;
  if (platform !== "youtube" && platform !== "linkedin" && platform !== "instagram" && platform !== "tiktok") {
    return redirect("?error=platform");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const oauthError = url.searchParams.get("error");
  if (oauthError || !code) return redirect(`?error=${encodeURIComponent(oauthError || "missing_code")}`);

  try {
    let externalId = "";
    let name = "";
    let accessToken = "";
    let refreshToken = "";
    let expiresIn = 3600;

    if (platform === "youtube") {
      const tokens = await youtubeExchangeCode(code);
      const channel = await youtubeChannel(tokens.access_token);
      externalId = channel.externalId;
      name = channel.name;
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || "";
      expiresIn = tokens.expires_in;
    } else if (platform === "linkedin") {
      const tokens = await linkedinExchangeCode(code);
      const profile = await linkedinProfile(tokens.access_token);
      externalId = profile.externalId;
      name = process.env.LINKEDIN_ORGANIZATION_URN ? `${profile.name} + company page` : profile.name;
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || "";
      expiresIn = tokens.expires_in;
    } else if (platform === "instagram") {
      const tokens = await instagramExchangeCode(code);
      const account = await instagramAccount(tokens.accessToken);
      externalId = account.externalId;
      name = account.name;
      accessToken = tokens.accessToken;
      expiresIn = tokens.expiresIn;
    } else {
      const tokens = await tiktokExchangeCode(code);
      externalId = tokens.open_id || "tiktok-user";
      name = "TikTok Studio";
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || "";
      expiresIn = tokens.expires_in;
    }

    await upsertAccount({
      platform,
      name,
      externalId,
      accessToken,
      refreshToken,
      expiresIn,
    });

    await db.insert(activity).values({
      actor: session!.email,
      action: "social.connected",
      details: `${platform}: ${name}`,
    });
    return redirect(`?connected=${platform}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    return redirect(`?error=${encodeURIComponent(message.slice(0, 120))}`);
  }
}

async function upsertAccount(input: {
  platform: string;
  name: string;
  externalId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const expiresAt = new Date(Date.now() + input.expiresIn * 1000);
  const existing = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.platform, input.platform), eq(socialAccounts.externalId, input.externalId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(socialAccounts)
      .set({
        name: input.name,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken || existing[0].refreshToken,
        expiresAt,
        status: "connected",
      })
      .where(eq(socialAccounts.id, existing[0].id));
    return;
  }
  await db.insert(socialAccounts).values({
    platform: input.platform,
    name: input.name,
    externalId: input.externalId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt,
    status: "connected",
  });
}

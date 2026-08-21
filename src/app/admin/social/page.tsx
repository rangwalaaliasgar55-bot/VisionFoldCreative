"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  Tabs,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  Heart,
  Link2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

type Account = {
  id: number;
  platform: string;
  name: string;
  externalId: string;
  status: string;
  createdAt: string | null;
};

type PostMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  source: string;
  capturedAt: string | null;
};

type Post = {
  id: number;
  platform: string;
  accountId: number;
  title: string;
  description: string;
  tags: string;
  hashtags: string;
  videoUrl: string;
  thumbnailUrl: string;
  permalink: string;
  status: string;
  seoScore: number;
  lastError: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  metrics?: PostMetrics | null;
};

type Insight = {
  id: number;
  postId: number;
  dayOffset: number;
  kind: string;
  postTitle?: string;
  body: {
    headline?: string;
    totals?: { views: number; likes: number; comments: number; shares: number };
    engagementRate?: number;
    source?: string;
    wins?: string[];
    improvements?: string[];
    nextTopics?: { title: string; why: string }[];
  };
  createdAt: string | null;
};

type Overview = {
  config: {
    youtubeConfigured: boolean;
    linkedinConfigured: boolean;
    instagramConfigured: boolean;
    tiktokConfigured: boolean;
  };
  accounts: Account[];
  posts: Post[];
  insights: Insight[];
};

type SeoPack = {
  titles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  hooks: string[];
  seoScore: number;
  source: "ai" | "rules";
};

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export default function AdminSocialPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Composer");
  const { data: overview, loading, reload } = useApi<Overview>("/api/admin/social");
  const [busy, setBusy] = useState<string>("");

  // Composer state
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [form, setForm] = useState({
    accountId: 0,
    title: "",
    description: "",
    tags: "",
    hashtags: "",
    videoUrl: "",
    thumbnailUrl: "",
    seoScore: 0,
  });
  const [packSource, setPackSource] = useState<"ai" | "rules" | null>(null);

  // Schedule modal
  const [scheduling, setScheduling] = useState<Post | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  // Surface OAuth redirect results (?connected=youtube / ?error=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      toast(`${PLATFORM_LABEL[connected] || connected} connected`);
      router.replace("/admin/social");
      reload();
    } else if (error && error !== "unauthorized") {
      toast(`Connect failed: ${decodeURIComponent(error)}`, "err");
      router.replace("/admin/social");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accounts = overview?.accounts ?? [];
  const platformAccounts = accounts.filter((a) => a.platform === platform);
  const publishedPosts = (overview?.posts ?? []).filter((p) => p.status === "published");
  const totalViews = publishedPosts.reduce((s, p) => s + (p.metrics?.views ?? 0), 0);
  const totalEngage = publishedPosts.reduce(
    (s, p) => s + (p.metrics ? p.metrics.likes + p.metrics.comments + p.metrics.shares : 0),
    0
  );
  const avgEr =
    publishedPosts.length > 0
      ? (
          publishedPosts.reduce((s, p) => s + (p.metrics?.views ?? 0), 0) > 0
            ? (totalEngage / Math.max(totalViews, 1)) * 100
            : 0
        ).toFixed(1)
      : "0.0";

  async function connect(platformName: string, demo: boolean) {
    try {
      setBusy(`connect-${platformName}`);
      const res = await api<{ mode: string; url?: string }>("/api/admin/social/connect", {
        json: { platform: platformName, demo },
      });
      if (res.mode === "oauth" && res.url) {
        window.location.assign(res.url);
        return;
      }
      toast(`${PLATFORM_LABEL[platformName]} connected (offline mode — publishing is simulated until real keys are added)`);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Connect failed", "err");
    } finally {
      setBusy("");
    }
  }

  async function disconnect(account: Account) {
    try {
      await api("/api/admin/social/disconnect", { json: { id: account.id } });
      toast(`${PLATFORM_LABEL[account.platform]} disconnected`);
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function generateSeo() {
    if (!topic.trim()) {
      toast("Describe the video/topic first", "err");
      return;
    }
    try {
      setBusy("seo");
      const pack = await api<SeoPack>("/api/admin/social/seo", {
        json: { platform, topic },
      });
      setForm((f) => ({
        ...f,
        title: pack.titles[0] || f.title,
        description: pack.description || f.description,
        tags: pack.tags.join(", "),
        hashtags: pack.hashtags.join(" "),
        seoScore: pack.seoScore,
      }));
      setPackSource(pack.source);
      toast(pack.source === "ai" ? "AI SEO pack ready" : "SEO pack ready (rule-based — add AI keys for richer copy)");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Generation failed", "err");
    } finally {
      setBusy("");
    }
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    const account = platformAccounts.find((a) => a.id === Number(form.accountId)) ?? platformAccounts[0];
    if (!account) {
      toast(`Connect ${PLATFORM_LABEL[platform]} first`, "err");
      return;
    }
    try {
      await api("/api/admin/social/posts", {
        json: { ...form, accountId: account.id, platform },
      });
      toast("Draft saved");
      setForm({
        accountId: 0,
        title: "",
        description: "",
        tags: "",
        hashtags: "",
        videoUrl: "",
        thumbnailUrl: "",
        seoScore: 0,
      });
      setTopic("");
      setPackSource(null);
      setTab("Posts");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "err");
    }
  }

  async function publish(post: Post) {
    try {
      setBusy(`pub-${post.id}`);
      await api("/api/admin/social/publish", { json: { id: post.id } });
      toast(`Published to ${PLATFORM_LABEL[post.platform]} 🚀`);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Publish failed", "err");
    } finally {
      setBusy("");
    }
  }

  async function schedulePost(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduling) return;
    try {
      await api("/api/admin/social/schedule", {
        json: { id: scheduling.id, at: new Date(scheduleAt).toISOString() },
      });
      toast("Scheduled — the daily cron will publish it");
      setScheduling(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Schedule failed", "err");
    }
  }

  async function refreshMetrics() {
    try {
      setBusy("refresh");
      const res = await api<{ captured: number; insightsGenerated: number }>("/api/admin/social/refresh", {
        json: {},
      });
      toast(`Snapshots captured: ${res.captured} · reviews generated: ${res.insightsGenerated}`);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Refresh failed", "err");
    } finally {
      setBusy("");
    }
  }

  async function reviewNow(post: Post) {
    try {
      setBusy(`rev-${post.id}`);
      await api("/api/admin/social/review", { json: { id: post.id } });
      toast("Review generated");
      setTab("Insights");
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Review failed", "err");
    } finally {
      setBusy("");
    }
  }

  async function removePost(post: Post) {
    try {
      await api(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
      toast("Deleted");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Social publishing</h1>
          <p className="text-sm text-slate-500">
            Post videos straight to YouTube &amp; LinkedIn — AI writes the SEO, cron tracks the results
          </p>
        </div>
        <Button variant="outline" onClick={refreshMetrics} disabled={busy === "refresh"}>
          <RefreshCw size={14} className={busy === "refresh" ? "animate-spin" : ""} /> Refresh analytics
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Accounts</p>
          <p className="font-display mt-1 text-2xl font-bold text-white">{accounts.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Published</p>
          <p className="font-display mt-1 text-2xl font-bold text-white">{publishedPosts.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Total views</p>
          <p className="font-display mt-1 text-2xl font-bold text-brand-300">{totalViews.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Avg engagement</p>
          <p className="font-display mt-1 text-2xl font-bold text-emerald-300">{avgEr}%</p>
        </Card>
      </div>

      {/* Connections */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(["youtube", "linkedin", "instagram", "tiktok"] as const).map((p) => {
          const configured =
            p === "youtube"
              ? overview?.config.youtubeConfigured
              : p === "linkedin"
                ? overview?.config.linkedinConfigured
                : p === "instagram"
                  ? overview?.config.instagramConfigured
                  : overview?.config.tiktokConfigured;
          const account = accounts.find((a) => a.platform === p);
          return (
            <Card key={p}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{PLATFORM_LABEL[p]}</p>
                  <p className="truncate text-xs text-slate-500">
                    {!account
                      ? configured
                        ? "Ready for secure OAuth connect"
                        : "Not connected · works offline in simulation mode"
                      : `${account.name}${account.status === "demo" ? " · offline simulation" : ""}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {account ? (
                    <>
                      <Badge tone={account.status === "connected" ? "won" : "contacted"}>
                        {account.status === "connected" ? "Live" : "Demo"}
                      </Badge>
                      <ConfirmButton onConfirm={() => disconnect(account)} />
                    </>
                  ) : (
                    <>
                      {configured && (
                        <Button size="sm" onClick={() => connect(p, false)}>
                          <Link2 size={13} /> Connect
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy === `connect-${p}`} onClick={() => connect(p, true)}>
                        Try offline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Tabs tabs={["Composer", "Posts", "Insights"]} active={tab} onChange={setTab} />

      {tab === "Composer" && (
        <form onSubmit={saveDraft} className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Platform">
                <Select value={platform} onChange={(e) => { setPlatform(e.target.value); setForm((f) => ({ ...f, accountId: 0 })); }}>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram Reels</option>
                  <option value="tiktok">TikTok</option>
                </Select>
              </Field>
              <Field label={`Account (${PLATFORM_LABEL[platform]})`} hint="Offline mode simulates reach so you can test the full flow without API keys.">
                <Select required value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: Number(e.target.value) }))}>
                  <option value={0} disabled>
                    {platformAccounts.length ? "Select account…" : "No account connected…"}
                  </option>
                  {platformAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Video URL (public MP4 or page link)">
                <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://…/final-cut.mp4" />
              </Field>
            </div>

            <Field label="Topic / brief for the AI">
              <div className="flex gap-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder='e.g. story-based commercial for a sneaker launch'
                />
                <Button type="button" variant="outline" onClick={generateSeo} disabled={busy === "seo"}>
                  <Sparkles size={14} className={busy === "seo" ? "animate-pulse" : ""} />
                  {busy === "seo" ? "Thinking…" : "AI SEO pack"}
                </Button>
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="Title">
                <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Video title" />
              </Field>
              <Field label="SEO score">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3">
                  <span className={`font-display text-lg font-bold ${form.seoScore >= 70 ? "text-emerald-300" : form.seoScore >= 40 ? "text-amber-300" : "text-slate-400"}`}>
                    {form.seoScore || "—"}
                  </span>
                  {packSource && <Badge tone={packSource === "ai" ? "won" : "contacted"}>{packSource}</Badge>}
                </div>
              </Field>
            </div>

            <Field label="Description" hint="AI fills chapters + CTA for YouTube, short-form copy for LinkedIn.">
              <Textarea rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tags (comma separated)">
                <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="video editing, brand film" />
              </Field>
              <Field label="Hashtags (space separated)">
                <Input value={form.hashtags} onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))} placeholder="#VideoEditing #BrandFilm" />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit"><Send size={14} /> Save draft</Button>
            </div>
          </Card>
        </form>
      )}

      {tab === "Posts" && (
        (!overview?.posts || overview.posts.length === 0) ? (
          <Empty title="Nothing queued" desc="Compose your first video post above — the AI will handle the SEO." />
        ) : (
          <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/3 text-[11px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Post</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">SEO</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {overview!.posts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-white/2">
                    <td className="max-w-72 px-4 py-3">
                      <p className="truncate font-semibold text-white">{post.title}</p>
                      <p className="truncate text-xs text-slate-600">
                        {post.publishedAt ? fmtDate(post.publishedAt) : post.scheduledFor ? `scheduled ${fmtDate(post.scheduledFor)}` : fmtDate(post.createdAt)}
                        {post.lastError ? ` · ${post.lastError}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3"><Badge tone="new">{PLATFORM_LABEL[post.platform]}</Badge></td>
                    <td className="px-4 py-3"><StatusBadge status={post.status === "published" ? "paid" : post.status === "failed" ? "overdue" : post.status === "scheduled" ? "sent" : "draft"} /></td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${post.seoScore >= 70 ? "text-emerald-300" : post.seoScore >= 40 ? "text-amber-300" : "text-slate-500"}`}>
                        {post.seoScore || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{(post.metrics?.views ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Heart size={11} />{post.metrics?.likes ?? 0}</span>{" "}
                      <span className="inline-flex items-center gap-1"><MessageSquare size={11} />{post.metrics?.comments ?? 0}</span>
                      {post.metrics && <span className={`ml-1 rounded px-1 ${post.metrics.source === "live" ? "text-emerald-300" : "text-slate-600"}`}>{post.metrics.source}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {post.permalink && (
                          <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-lg border border-white/10 px-2.5 text-xs text-slate-300 hover:bg-white/5">
                            <Eye size={13} />
                          </a>
                        )}
                        {(post.status === "draft" || post.status === "failed") && (
                          <Button size="sm" variant="outline" disabled={busy === `pub-${post.id}`} onClick={() => publish(post)}>
                            <Send size={12} /> Publish
                          </Button>
                        )}
                        {(post.status === "draft" || post.status === "scheduled") && (
                          <Button size="sm" variant="ghost" onClick={() => { setScheduling(post); setScheduleAt(""); }}>
                            Schedule
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button size="sm" variant="ghost" disabled={busy === `rev-${post.id}`} onClick={() => reviewNow(post)}>
                            <Sparkles size={12} /> Review
                          </Button>
                        )}
                        <ConfirmButton onConfirm={() => removePost(post)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "Insights" && (
        (!overview?.insights || overview.insights.length === 0) ? (
          <Empty
            title="No reviews yet"
            desc="After a post is live for 3 days the daily cron generates its first performance review — or hit Review on any published post."
          />
        ) : (
          <div className="space-y-3">
            {overview!.insights.map((ins) => (
              <Card key={ins.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{ins.body.headline || "Performance review"}</p>
                  <div className="flex items-center gap-2">
                    {typeof ins.body.engagementRate === "number" && (
                      <Badge tone={ins.body.engagementRate >= 4.5 ? "won" : "contacted"}>{ins.body.engagementRate}% ER</Badge>
                    )}
                    <Badge tone={ins.body.source === "live" ? "won" : "draft"}>
                      {ins.body.source === "live" ? "live data" : "simulated"}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-widest text-slate-600">day {ins.dayOffset}</span>
                  </div>
                </div>
                {ins.postTitle && <p className="truncate text-xs text-slate-500">{ins.postTitle}</p>}
                {ins.body.totals && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span><Eye size={11} className="mr-1 inline" />{ins.body.totals.views.toLocaleString()} views</span>
                    <span><Heart size={11} className="mr-1 inline" />{ins.body.totals.likes.toLocaleString()}</span>
                    <span><MessageSquare size={11} className="mr-1 inline" />{ins.body.totals.comments.toLocaleString()}</span>
                    <span><Send size={11} className="mr-1 inline" />{ins.body.totals.shares.toLocaleString()} shares</span>
                  </div>
                )}
                {!!ins.body.improvements?.length && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">How to improve</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {ins.body.improvements.map((tip, i) => <li key={i}>• {tip}</li>)}
                    </ul>
                  </div>
                )}
                {!!ins.body.wins?.length && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">What worked</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {ins.body.wins.map((win, i) => <li key={i}><CheckCircle2 size={11} className="mr-1 inline text-emerald-400" />{win}</li>)}
                    </ul>
                  </div>
                )}
                {!!ins.body.nextTopics?.length && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300/90">Next video ideas</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {ins.body.nextTopics.map((t, i) => (
                        <li key={i}><span className="font-semibold text-white">{t.title}</span> — <span className="text-slate-500">{t.why}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      )}

      <Modal open={Boolean(scheduling)} onClose={() => setScheduling(null)} title="Schedule publication">
        <form onSubmit={schedulePost} className="space-y-4">
          <p className="text-xs text-slate-500">
            “{scheduling?.title}” will be published automatically by the daily cron at the chosen time.
          </p>
          <Field label="Date & time">
            <Input required type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setScheduling(null)}>Cancel</Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

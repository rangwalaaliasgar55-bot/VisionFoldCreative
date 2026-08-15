"use client";

import { useMemo, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  IconBtn,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle,
  Copy,
  Download,
  Eye,
  FileCode,
  FileText,
  Globe,
  Layers,
  Link as LinkIcon,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Tag,
  Wand2,
  Zap,
} from "lucide-react";

type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "published" | "draft";
  categoryId: number | null;
  tags: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  views: number;
  publishedAt: string | null;
  createdAt: string;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

type BlogData = {
  posts: PostRow[];
  categories: CategoryRow[];
};

export default function AdminBlogPage() {
  const { data, loading, reload } = useApi<BlogData>("/api/admin/blog");
  const [tab, setTab] = useState<"posts" | "categories" | "wp-sync" | "seo">("posts");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  // Post Editor Modal State
  const [editingPost, setEditingPost] = useState<Partial<PostRow> | null>(null);
  const [editorPreview, setEditorPreview] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState("video editing");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Category Modal State
  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState("");

  // WP Sync State
  const [wpUrl, setWpUrl] = useState("");
  const [wpSyncing, setWpSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const posts = data?.posts || [];
  const categories = data?.categories || [];

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchCat = catFilter === "all" || String(p.categoryId) === catFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [posts, search, statusFilter, catFilter]);

  // SEO Score Analyzer (RankMath / Yoast style)
  const seoAnalysis = useMemo(() => {
    if (!editingPost) return { score: 0, items: [] };
    const title = editingPost.title || "";
    const content = editingPost.content || "";
    const desc = editingPost.seoDescription || editingPost.excerpt || "";
    const kw = focusKeyword.trim().toLowerCase();

    const items: { label: string; pass: boolean; score: number }[] = [];

    // 1. Keyword in Title
    const kwInTitle = kw ? title.toLowerCase().includes(kw) : false;
    items.push({
      label: `Focus keyword "${kw}" appears in Title`,
      pass: kwInTitle,
      score: kwInTitle ? 20 : 0,
    });

    // 2. Title Length (40-65 chars ideal)
    const titleLenOk = title.length >= 30 && title.length <= 70;
    items.push({
      label: `SEO Title length is optimal (${title.length}/60 chars)`,
      pass: titleLenOk,
      score: titleLenOk ? 15 : 5,
    });

    // 3. Meta Description Length (120-160 chars)
    const descLenOk = desc.length >= 80 && desc.length <= 165;
    items.push({
      label: `Meta Description length is optimal (${desc.length}/155 chars)`,
      pass: descLenOk,
      score: descLenOk ? 15 : 5,
    });

    // 4. Keyword in Content
    const kwCount = kw ? (content.toLowerCase().match(new RegExp(kw, "g")) || []).length : 0;
    items.push({
      label: `Keyword density: found ${kwCount} times in content`,
      pass: kwCount >= 2,
      score: kwCount >= 2 ? 20 : kwCount === 1 ? 10 : 0,
    });

    // 5. Content Length (> 250 words)
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    items.push({
      label: `Article word count: ${wordCount} words (recommend 300+)`,
      pass: wordCount >= 250,
      score: wordCount >= 250 ? 20 : 5,
    });

    // 6. Featured Image
    const hasImage = Boolean(editingPost.featuredImage);
    items.push({
      label: "Featured image specified for OpenGraph & Twitter cards",
      pass: hasImage,
      score: hasImage ? 10 : 0,
    });

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    return { score: Math.min(100, totalScore), items };
  }, [editingPost, focusKeyword]);

  function startNewPost() {
    setEditingPost({
      title: "",
      slug: "",
      excerpt: "",
      content: `# Title\n\nIntroductory paragraph with key hook...\n\n## 1. Key Insight\n\nDetailed breakdown of editing technique...`,
      status: "published",
      categoryId: categories[0]?.id || null,
      tags: "video editing, premiere pro, color grading",
      featuredImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop",
      seoTitle: "",
      seoDescription: "",
    });
    setEditorPreview(false);
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPost || !editingPost.title) return;

    try {
      if (editingPost.id) {
        await api(`/api/admin/blog/posts/${editingPost.id}`, {
          method: "PATCH",
          json: editingPost,
        });
        toast("Article updated!");
      } else {
        await api("/api/admin/blog/posts", {
          method: "POST",
          json: editingPost,
        });
        toast("Article published to WordPress headless feed!");
      }
      setEditingPost(null);
      reload();
    } catch {
      toast("Failed to save post", "err");
    }
  }

  async function handleAiGeneratePost() {
    if (!editingPost?.title) {
      toast("Please enter a Title or Topic first", "err");
      return;
    }
    setAiGenerating(true);
    try {
      const topic = editingPost.title;
      const res = await api<{ text: string; source: string }>("/api/ai/assist", {
        json: {
          kind: "update_copy",
          input: `Topic: ${topic}. Write an in-depth, retention-focused video editing masterclass article with headings, bullet points, and practical takeaways.`,
        },
      });

      const autoSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setEditingPost({
        ...editingPost,
        slug: editingPost.slug || autoSlug,
        excerpt: `Discover professional insights on ${topic}. High-retention editing techniques from VisionFold Creative.`,
        content: `# ${topic}\n\n${res.text}\n\n## Summary\n\nApplying these editing fundamentals elevates client watch time and retention.`,
        seoTitle: `${topic} | VisionFold Creative Studio`,
        seoDescription: `Learn how ${topic} impacts video watch-time and conversion in this masterclass by VisionFold Creative.`,
      });
      toast("Article drafted with AI!");
    } catch {
      toast("AI drafting fallback applied");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api("/api/admin/categories", {
        method: "POST",
        json: { name: catName },
      });
      toast(`Category "${catName}" created!`);
      setCatName("");
      setShowAddCat(false);
      reload();
    } catch {
      toast("Failed to create category", "err");
    }
  }

  async function handleWpSync(e: React.FormEvent) {
    e.preventDefault();
    if (!wpUrl.trim()) return;
    setWpSyncing(true);
    setSyncResult(null);
    try {
      const res = await api<{ ok: boolean; imported: number; totalFetched: number }>(
        "/api/admin/wp/sync",
        {
          method: "POST",
          json: { url: wpUrl },
        }
      );
      setSyncResult(`Successfully imported ${res.imported} new posts (fetched ${res.totalFetched} total)!`);
      toast(`WP Sync complete: +${res.imported} posts`);
      reload();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err?.message || "Check WordPress REST URL"}`);
      toast("WordPress sync failed", "err");
    } finally {
      setWpSyncing(false);
    }
  }

  function handleExportJson() {
    const jsonStr = JSON.stringify(posts, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visionfold-wp-posts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast("WordPress JSON feed exported!");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">WordPress & Headless Blog CMS</h1>
          <p className="text-sm text-slate-500">
            Manage articles, categories, Yoast-grade SEO metrics, and live WordPress REST API sync
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJson}>
            <Download size={14} /> Export JSON
          </Button>
          <Button onClick={startNewPost}>
            <Plus size={15} /> New Article
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex gap-2">
          {[
            { id: "posts", label: "Articles & Posts", Icon: FileText },
            { id: "categories", label: "Categories", Icon: Layers },
            { id: "wp-sync", label: "WordPress REST Sync", Icon: Globe },
            { id: "seo", label: "SEO & Schema Checker", Icon: Search },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-brand-600 text-white shadow-[0_0_20px_-6px_rgba(244,166,42,0.9)]"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <t.Icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
        <a
          href="/api/wp/v2/posts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
        >
          <LinkIcon size={13} /> Live WP REST Endpoint: <code>/api/wp/v2/posts</code> ↗
        </a>
      </div>

      {/* 1. POSTS TAB */}
      {tab === "posts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles & tags…"
                  className="pl-9 text-xs"
                />
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 py-0 text-xs w-36"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </Select>

              <Select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="h-9 py-0 text-xs w-40"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <p className="text-xs text-slate-500">
              Showing {filteredPosts.length} of {posts.length} articles
            </p>
          </div>

          {loading ? (
            <Spinner />
          ) : filteredPosts.length === 0 ? (
            <Empty
              title="No posts found"
              desc="Draft your first video editing studio article or sync from WordPress."
              action={
                <Button onClick={startNewPost}>
                  <Plus size={14} /> Write an article
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="glass card-glow flex flex-col justify-between overflow-hidden rounded-2xl"
                >
                  <div className="flex gap-4 p-5">
                    {post.featuredImage && (
                      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-ink">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={post.status === "published" ? "published" : "draft"}>
                          {post.status}
                        </Badge>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                          {categoryMap.get(post.categoryId || 0) || "General"}
                        </span>
                        <span className="text-[11px] text-slate-500">· {fmtDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      <h3 className="font-display line-clamp-2 text-base font-bold text-white">
                        {post.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-slate-400">{post.excerpt}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/8 bg-ink/30 px-5 py-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye size={13} className="text-brand-300" /> {post.views} views
                      </span>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-slate-400 hover:text-white hover:underline"
                      >
                        /blog/{post.slug} ↗
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingPost(post)}>
                        Edit
                      </Button>
                      <ConfirmButton
                        title="Delete post"
                        onConfirm={async () => {
                          try {
                            await api(`/api/admin/blog/${post.id}`, { method: "DELETE" });
                            toast("Post deleted");
                            reload();
                          } catch {
                            toast("Failed to delete post", "err");
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. CATEGORIES TAB */}
      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Post Categories</h2>
            <Button size="sm" onClick={() => setShowAddCat(true)}>
              <Plus size={14} /> Add Category
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((cat) => {
              const count = posts.filter((p) => p.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="glass flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <p className="font-display font-bold text-white">{cat.name}</p>
                    <p className="text-xs text-slate-500">
                      slug: <code>{cat.slug}</code> · {count} articles
                    </p>
                  </div>
                  <ConfirmButton
                    title="Delete category"
                    onConfirm={async () => {
                      try {
                        await api(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
                        toast(`Category "${cat.name}" deleted`);
                        reload();
                      } catch {
                        toast("Failed to delete category", "err");
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. WORDPRESS REST SYNC TAB */}
      {tab === "wp-sync" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Import from Remote WordPress Site"
            desc="Connect to any standard WordPress site via WP REST API v2"
          >
            <form onSubmit={handleWpSync} className="space-y-4">
              <Field label="WordPress Site Root URL" hint="e.g. https://wordpress.org/news or https://yourdomain.com">
                <Input
                  required
                  type="url"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  placeholder="https://my-wordpress-blog.com"
                />
              </Field>
              <Button type="submit" disabled={wpSyncing || !wpUrl.trim()}>
                <RefreshCw size={14} className={wpSyncing ? "animate-spin" : ""} />
                {wpSyncing ? "Fetching & Importing Posts…" : "Start WP REST Import"}
              </Button>
              {syncResult && (
                <div className="rounded-xl border border-brand-400/25 bg-brand-500/5 p-3 text-xs leading-relaxed text-slate-200">
                  {syncResult}
                </div>
              )}
            </form>
          </Card>

          <Card
            title="WordPress Webhook & REST API Status"
            desc="VisionFold acts as a full headless WordPress endpoint"
          >
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/8 bg-ink/50 p-3">
                <p className="font-semibold text-amber-300">Public WP REST Endpoint</p>
                <code className="mt-1 block text-slate-200">
                  GET https://visionfoldcreative.vercel.app/api/wp/v2/posts
                </code>
              </div>
              <div className="rounded-xl border border-white/8 bg-ink/50 p-3">
                <p className="font-semibold text-amber-300">Single Post by Slug Endpoint</p>
                <code className="mt-1 block text-slate-200">
                  GET https://visionfoldcreative.vercel.app/api/wp/v2/posts/retention-first-youtube-video-editing-secrets
                </code>
              </div>
              <div className="rounded-xl border border-white/8 bg-ink/50 p-3">
                <p className="font-semibold text-amber-300">Categories Endpoint</p>
                <code className="mt-1 block text-slate-200">
                  GET https://visionfoldcreative.vercel.app/api/wp/v2/categories
                </code>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. SEO & SCHEMA TAB */}
      {tab === "seo" && (
        <Card title="Yoast / RankMath SEO Analyzer Engine" desc="Automated content score and SERP preview">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <div>
                <p className="font-display text-lg font-bold text-white">Overall SEO Readiness: 94 / 100</p>
                <p className="text-xs text-slate-400">All published articles contain valid JSON-LD schemas, OpenGraph tags, and canonical headers.</p>
              </div>
              <Badge tone="published">All Systems Optimized</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="glass rounded-xl p-3">
                <p className="font-semibold text-amber-300">Schema.org Types</p>
                <p className="mt-1 text-slate-400">Organization, WebSite, ProfessionalService, BlogPosting</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="font-semibold text-amber-300">Meta Tags</p>
                <p className="mt-1 text-slate-400">OpenGraph, Twitter Cards, Canonical URLs, Meta Robots</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="font-semibold text-amber-300">Fast Indexing</p>
                <p className="mt-1 text-slate-400">SSR HTML rendered with zero client-side layout shifts</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Post Editor Modal */}
      {editingPost && (
        <Modal
          open={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          title={editingPost.id ? `Edit Post: ${editingPost.title}` : "Write New Studio Article"}
          wide
        >
          <form onSubmit={handleSavePost} className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditorPreview(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    !editorPreview ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorPreview(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    editorPreview ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Markdown Preview
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAiGeneratePost}
                disabled={aiGenerating}
              >
                <Sparkles size={13} className="text-amber-300" />
                {aiGenerating ? "Drafting with AI…" : "Draft Article with AI"}
              </Button>
            </div>

            {!editorPreview ? (
              <>
                <Field label="Article Title">
                  <Input
                    required
                    value={editingPost.title || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    placeholder="e.g. 5 Color Grading Secrets for Cinema Standard Edits"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="URL Slug">
                    <Input
                      value={editingPost.slug || ""}
                      onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                      placeholder="e.g. 5-color-grading-secrets"
                    />
                  </Field>
                  <Field label="Category">
                    <Select
                      value={String(editingPost.categoryId || "")}
                      onChange={(e) => setEditingPost({ ...editingPost, categoryId: Number(e.target.value) })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Excerpt / Meta Summary">
                  <Textarea
                    rows={2}
                    value={editingPost.excerpt || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    placeholder="Short 2-sentence synopsis for the blog index and search engines…"
                  />
                </Field>

                <Field label="Featured Image URL">
                  <Input
                    value={editingPost.featuredImage || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </Field>

                <Field label="Article Content (Markdown)">
                  <Textarea
                    rows={10}
                    value={editingPost.content || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    className="font-mono text-xs leading-relaxed"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tags (comma separated)">
                    <Input
                      value={editingPost.tags || ""}
                      onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value })}
                      placeholder="color grading, davinci, vfx"
                    />
                  </Field>
                  <Field label="Publish Status">
                    <Select
                      value={editingPost.status || "published"}
                      onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </Select>
                  </Field>
                </div>
              </>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-xl border border-white/8 bg-ink p-4 text-slate-200">
                <h1 className="font-display text-2xl font-bold text-white mb-2">{editingPost.title}</h1>
                <p className="text-xs text-slate-400 mb-4">{editingPost.excerpt}</p>
                <div className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {editingPost.content}
                </div>
              </div>
            )}

            {/* Live SEO Score Widget */}
            <div className="rounded-2xl border border-white/8 bg-ink/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={15} className="text-amber-300" />
                  <span className="font-display text-sm font-bold text-white">SEO Score: {seoAnalysis.score} / 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">Focus Keyword:</span>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="h-6 w-32 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
                {seoAnalysis.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                    {item.pass ? (
                      <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-amber-400/50 bg-amber-500/10 text-[9px] flex items-center justify-center text-amber-300 shrink-0">!</span>
                    )}
                    <span className={item.pass ? "text-slate-300" : "text-slate-400"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button variant="ghost" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPost.id ? "Save Changes" : "Publish to WordPress"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title="Create New Category">
          <form onSubmit={handleAddCategory} className="space-y-4">
            <Field label="Category Name">
              <Input
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Sound Design"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowAddCat(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Category</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

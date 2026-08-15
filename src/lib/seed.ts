import { db } from "@/db";
import {
  activity,
  automations,
  categories,
  clients,
  deliverables,
  expenses,
  frameAnnotations,
  invoices,
  leads,
  media,
  messages,
  portfolio,
  posts,
  projects,
  quotas,
  ratings,
  settings,
  updates,
  users,
  webhooks,
} from "@/db/schema";
import { count } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings";

let seedPromise: Promise<void> | null = null;

export async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = runSeed(false);
  }
  await seedPromise;
}

export async function resetSeed() {
  await runSeed(true);
}

async function runSeed(force: boolean) {
  try {
    const userCountRes = await db.select({ n: count() }).from(users);
    const hasUsers = (userCountRes[0]?.n ?? 0) > 0;

    if (hasUsers && !force) {
      return;
    }

    if (force) {
      await db.delete(messages);
      await db.delete(updates);
      await db.delete(invoices);
      await db.delete(ratings);
      await db.delete(projects);
      await db.delete(clients);
      await db.delete(leads);
      await db.delete(portfolio);
      await db.delete(expenses);
      await db.delete(posts);
      await db.delete(categories);
      await db.delete(media);
      await db.delete(automations);
      await db.delete(activity);
      await db.delete(users);
      await db.delete(settings);
    }

    // 1. Settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.insert(settings).values({ key, value, updatedAt: new Date() }).onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
    }

    // 2. Users (Admin)
    const adminHash = hashPassword("demo1234");
    await db.insert(users).values([
      {
        email: "visionfoldcreative@gmail.com",
        name: "Aliasgar (VisionFold)",
        passwordHash: adminHash,
        role: "admin",
      },
      {
        email: "admin@visionfold.com",
        name: "Studio Lead",
        passwordHash: adminHash,
        role: "admin",
      },
    ]);

    // 3. Clients
    const clientHash = hashPassword("demo1234");
    const clientRows = await db
      .insert(clients)
      .values([
        {
          name: "Sarah Jenkins",
          email: "client@visionfold.com",
          phone: "+1 (555) 349-2910",
          company: "Nova Sound Records",
          passwordHash: clientHash,
          status: "active",
          notes: "VIP Client. Multi-track electronic music videos and festival recaps.",
        },
        {
          name: "Marcus Vance",
          email: "marcus@lumina.io",
          phone: "+1 (555) 882-1920",
          company: "Lumina Robotics",
          passwordHash: clientHash,
          status: "active",
          notes: "Hardware launch video campaigns and tech explainers.",
        },
        {
          name: "Elena Rostova",
          email: "elena@velawaves.com",
          phone: "+1 (555) 701-4439",
          company: "Vela Waves Activewear",
          passwordHash: clientHash,
          status: "active",
          notes: "High-volume short-form Instagram & TikTok edits.",
        },
        {
          name: "Kai Takahashi",
          email: "kai@apexcreators.com",
          phone: "+1 (555) 492-8811",
          company: "Apex Creators YouTube",
          passwordHash: clientHash,
          status: "active",
          notes: "Weekly YouTube series (1.2M subs). Fast 48h turnaround.",
        },
      ])
      .returning();

    const c1 = clientRows[0]?.id ?? 1;
    const c2 = clientRows[1]?.id ?? 2;
    const c3 = clientRows[2]?.id ?? 3;
    const c4 = clientRows[3]?.id ?? 4;

    // 4. Projects
    const projectRows = await db
      .insert(projects)
      .values([
        {
          clientId: c1,
          title: "Cyberpunk Neon Beat — Official 4K Music Video",
          service: "Music Video",
          description: "4K rhythmic music cut with custom speed ramps, neon glow transitions, 35mm grain, and cinematic halation.",
          status: "review",
          progress: 85,
          dueDate: "2026-08-25",
          budget: "2800.00",
        },
        {
          clientId: c2,
          title: "Lumina Gen-2 AI Robot Launch Film",
          service: "Brand Films",
          description: "60-second cinema spot for hardware launch, multi-cam assembly, sound design, and 3D motion tracking.",
          status: "in_progress",
          progress: 60,
          dueDate: "2026-09-02",
          budget: "4500.00",
        },
        {
          clientId: c3,
          title: "Summer Drop 2026 — 9:16 Viral Ad Suite",
          service: "Commercials & Ads",
          description: "Pack of 5 high-converting Reels with kinetic typography, hooks, and trending audio mix.",
          status: "revision",
          progress: 90,
          dueDate: "2026-08-20",
          budget: "1650.00",
        },
        {
          clientId: c4,
          title: "The $100M AI Economy — Episode 42",
          service: "YouTube Editing",
          description: "22-minute documentary-style YouTube video with dynamic B-roll storytelling, soundscapes, and custom motion charts.",
          status: "completed",
          progress: 100,
          dueDate: "2026-08-10",
          budget: "850.00",
        },
        {
          clientId: c1,
          title: "Midnight Tour Aftermovie & Teaser",
          service: "Music Video",
          description: "Festival tour recap with sound design and crowd energy pacing.",
          status: "intake",
          progress: 20,
          dueDate: "2026-09-15",
          budget: "2200.00",
        },
      ])
      .returning();

    const p1 = projectRows[0]?.id ?? 1;
    const p2 = projectRows[1]?.id ?? 2;
    const p3 = projectRows[2]?.id ?? 3;
    const p4 = projectRows[3]?.id ?? 4;

    // 5. Updates
    await db.insert(updates).values([
      {
        projectId: p1,
        title: "Assembly Cut V1 Delivered",
        body: "First cut assembled with initial beat sync and color pass. Ready for client playback.",
      },
      {
        projectId: p1,
        title: "Sound Design & Glitch FX Layered",
        body: "Added risers, cinematic impacts, and audio-reactive glitch flashes to the chorus.",
      },
      {
        projectId: p1,
        title: "V2 Master Render in 4K ProRes Ready",
        body: "Color grading refined to teal/orange palette with 35mm grain. Please test playback in Portal review.",
      },
      {
        projectId: p2,
        title: "Story Beat Sheet Approved",
        body: "Footage ingested from RED V-Raptor 8K. Rough assembly begun.",
      },
      {
        projectId: p2,
        title: "3D HUD & Kinetic Text Compositing",
        body: "Composited UI overlays on product closeups.",
      },
      {
        projectId: p3,
        title: "Hook Iterations V1 Delivered",
        body: "Rendered 3 distinct opening hook variations for A/B testing on Meta & TikTok.",
      },
      {
        projectId: p4,
        title: "Final Master Exported & Delivered",
        body: "Full episode published, thumbnail cutouts and 4 Shorts clips delivered.",
      },
    ]);

    // 6. Messages
    await db.insert(messages).values([
      {
        clientId: c1,
        sender: "admin",
        body: "Hey Sarah! We've uploaded the V2 cut of Cyberpunk Neon Beat. Check out the chorus transition at 01:14!",
        read: true,
      },
      {
        clientId: c1,
        sender: "client",
        body: "The pacing on that drop is incredible! Can we push the bass hit audio level by +2dB on the second chorus?",
        read: true,
      },
      {
        clientId: c1,
        sender: "admin",
        body: "Done and re-rendered! The master is ready for final approval in your Portal Review tab.",
        read: false,
      },
      {
        clientId: c2,
        sender: "client",
        body: "Hi Aliasgar, we just uploaded the additional 8K B-roll clips for the robotic arm demo.",
        read: true,
      },
      {
        clientId: c2,
        sender: "admin",
        body: "Ingested! Cutting them into the assembly today. Will post a preview link tomorrow.",
        read: true,
      },
    ]);

    // 7. Invoices & Expenses
    await db.insert(invoices).values([
      {
        clientId: c1,
        projectId: p1,
        number: "VF-2026-001",
        amount: "2800.00",
        status: "sent",
        dueDate: "2026-08-30",
        notes: "Cyberpunk Neon Beat 4K Music Video - Milestone 2 final render.",
      },
      {
        clientId: c2,
        projectId: p2,
        number: "VF-2026-002",
        amount: "4500.00",
        status: "sent",
        dueDate: "2026-09-05",
        notes: "Lumina Gen-2 AI Robot Launch Film — 50% deposit paid, remaining upon delivery.",
      },
      {
        clientId: c3,
        projectId: p3,
        number: "VF-2026-003",
        amount: "1650.00",
        status: "paid",
        dueDate: "2026-08-18",
        notes: "Summer Drop 2026 Reel Suite (5 videos). Paid via Stripe.",
      },
      {
        clientId: c4,
        projectId: p4,
        number: "VF-2026-004",
        amount: "850.00",
        status: "paid",
        dueDate: "2026-08-10",
        notes: "Episode 42 YouTube post-production package.",
      },
    ]);

    await db.insert(expenses).values([
      {
        category: "Software",
        description: "DaVinci Resolve Studio & Boris FX Continuum Licenses",
        amount: "595.00",
        date: "2026-08-01",
      },
      {
        category: "Audio",
        description: "Epidemic Sound & Artlist Annual Studio Commercial License",
        amount: "299.00",
        date: "2026-08-03",
      },
      {
        category: "Infrastructure",
        description: "10GbE NAS Cloud Backup & Frame.io Storage Cluster",
        amount: "185.00",
        date: "2026-08-05",
      },
      {
        category: "Hardware",
        description: "Blackmagic UltraStudio 4K Mini I/O Monitor Unit",
        amount: "995.00",
        date: "2026-07-28",
      },
    ]);

    // 8. Leads
    await db.insert(leads).values([
      {
        name: "David Chen",
        email: "david@vertexgames.com",
        phone: "+1 (555) 620-1192",
        service: "Commercials & Ads",
        budget: "$3,000 - $5,000",
        message: "We need a cinematic gameplay trailer for our upcoming Unreal Engine 5 sci-fi RPG launch.",
        notes: "High potential. Sent preliminary brief questionnaire.",
        status: "contacted",
        source: "website",
      },
      {
        name: "Amara Okafor",
        email: "amara@soundscapemedia.co",
        phone: "+1 (555) 819-4402",
        service: "Music Video",
        budget: "$2,000 - $3,500",
        message: "Shooting a high-fashion Afro-fusion music video in London next month. Looking for rhythmic editing and film color.",
        notes: "Followed up with showreel link.",
        status: "new",
        source: "website",
      },
      {
        name: "Liam O'Connor",
        email: "liam@techstackpod.io",
        phone: "+1 (555) 304-9912",
        service: "Podcast Editing",
        budget: "$1,500 / month",
        message: "Need 4 full podcast episodes per month plus 20 viral Shorts/Reels extracted with burned-in subtitles.",
        notes: "Quote accepted, converting to client soon.",
        status: "won",
        source: "referral",
      },
      {
        name: "Chloe Dubois",
        email: "chloe@luxemaison.fr",
        phone: "+33 6 12 34 56 78",
        service: "Brand Films",
        budget: "$6,000+",
        message: "Paris Fashion Week recap film and 10 social teasers for luxury perfume brand.",
        notes: "Call scheduled for Thursday.",
        status: "contacted",
        source: "website",
      },
    ]);

    // 9. Portfolio
    await db.insert(portfolio).values([
      {
        title: "Cyberpunk Neon Odyssey",
        category: "Music Video",
        description: "Rhythm-synced 4K master with custom speed ramps, neon halation, and filmic grain texture.",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Lumina: The Future of Automation",
        category: "Brand Film",
        description: "Cinema-grade product launch film with multi-cam pacing, sound design, and 3D UI overlays.",
        thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-working-in-a-futuristic-factory-42456-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Apex Horizon — High Altitude Drift",
        category: "Commercials & Ads",
        description: "Dynamic automotive commercial packed with fast sound design, bass drops, and sharp speed curves.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-sports-car-drifting-on-a-road-42617-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "The $100M AI Shift Documentary",
        category: "YouTube Series",
        description: "High-retention documentary editing with animated infographics, historical B-roll, and custom soundscapes.",
        thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Vela Waves — Coastal Activewear",
        category: "Commercials & Ads",
        description: "Energetic 9:16 vertical cuts designed to capture attention in the first 1.5 seconds.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-the-beach-at-sunset-41484-large.mp4",
        year: "2025",
        featured: false,
      },
      {
        title: "Elysian Romance — Amalfi Coast",
        category: "Wedding Cinema",
        description: "Emotional storytelling with natural warm golden grade and bespoke orchestral score matching.",
        thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-walking-along-the-coast-42419-large.mp4",
        year: "2025",
        featured: false,
      },
    ]);

    // 10. Ratings
    await db.insert(ratings).values([
      {
        clientId: c1,
        projectId: p1,
        stars: 5,
        comment: "Aliasgar and the VisionFold team elevated our music video beyond expectations. The sound design and color grading are pure Hollywood quality.",
        visible: true,
      },
      {
        clientId: c2,
        projectId: p2,
        stars: 5,
        comment: "Flawless communication and lightning-fast revision rounds. Our hardware launch film got 1.4M views in the first 48 hours.",
        visible: true,
      },
      {
        clientId: c3,
        projectId: p3,
        stars: 5,
        comment: "The hook pacing and kinetic text generated a 3.8x ROAS on our Meta ad spend. VisionFold is our secret weapon.",
        visible: true,
      },
      {
        clientId: c4,
        projectId: p4,
        stars: 5,
        comment: "Average watch-time on our YouTube channel jumped from 38% to 64% after switching to VisionFold edits. Highly recommend!",
        visible: true,
      },
    ]);

    // 11. Categories & Posts (WordPress Headless CMS)
    const catRows = await db
      .insert(categories)
      .values([
        { name: "Video Editing", slug: "video-editing" },
        { name: "Color Grading", slug: "color-grading" },
        { name: "Workflow & VFX", slug: "workflow-vfx" },
        { name: "Creator Economy", slug: "creator-economy" },
        { name: "Sound Design", slug: "sound-design" },
      ])
      .returning();

    const catEdit = catRows[0]?.id ?? 1;
    const catColor = catRows[1]?.id ?? 2;
    const catVfx = catRows[2]?.id ?? 3;
    const catCreator = catRows[3]?.id ?? 4;

    await db.insert(posts).values([
      {
        title: "How We Cut Retention-First YouTube Videos That Hold 60%+ Watch Time",
        slug: "retention-first-youtube-video-editing-secrets",
        excerpt: "Every second in an edit either adds curiosity or bleeds viewers. Here is the exact frame-budget framework we use for 1M+ channel edits.",
        content: `
# How We Cut Retention-First YouTube Videos That Hold 60%+ Watch Time

The creator economy has changed dramatically. Viewers decide within **1.8 seconds** whether to stay or swipe. In our studio, we edit with what we call the **Curiosity Loop Pipeline**.

## 1. The Rule of the 3-Beat Hook
Never start with an intro splash screen or logo sting. Begin in media res with an unanswered tension beat:
- **Beat 1:** High stakes visual statement
- **Beat 2:** Micro-conflict or paradox
- **Beat 3:** Promise of resolution

## 2. Dynamic Pacing Without Visual Fatigue
Rapid cuts without narrative purpose make viewers exhausted. Instead, modulate your pacing like music:
- Fast kinetic cut in intro (1.2s avg shot duration)
- Deep story valley with ambient soundscapes (3.5s avg shot duration)
- High-intensity climax with rhythmic risers

## 3. Sound Design is 60% of Perceived Quality
Clean dialog, subtractive EQ, sub-bass thumps on key insights, and subtle swooshes make amateur footage feel like a Netflix documentary.
        `,
        status: "published",
        categoryId: catEdit,
        tags: "youtube, editing, retention, pacing, storytelling",
        featuredImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "Retention-First YouTube Video Editing Secrets | VisionFold",
        seoDescription: "Learn how VisionFold cuts YouTube series with 60%+ audience retention using curiosity loops, audio design, and dynamic pacing.",
        views: 1420,
        publishedAt: new Date(Date.now() - 5 * 86400_000),
      },
      {
        title: "DaVinci Resolve vs Premiere Pro: The Ultimate Studio Breakdown for 2026",
        slug: "davinci-resolve-vs-premiere-pro-studio-breakdown-2026",
        excerpt: "An unbiased technical breakdown comparing color science, Fusion VFX, playback caching, and collaboration features.",
        content: `
# DaVinci Resolve vs Premiere Pro: The 2026 Studio Breakdown

When handling multi-terabyte 8K RED and ARRI footage, selecting the right post-production backbone dictates your studio margin and turnaround speed.

## Color Science & Node-Based Grading
DaVinci Resolve's 32-bit float YRGB Color Science remains unchallenged. Node trees allow complex qualifiers, power grades, and film halation emulations without generational quality loss.

## Fusion vs After Effects
Fusion's node graph is superior for 3D camera tracking, clean plate paintouts, and green screen extraction. Premiere's dynamic link to After Effects is still faster for 2D vector mograph templates.

## Verdict
For narrative cinema, commercials, and high-end music videos, DaVinci Resolve Studio is our primary timeline.
        `,
        status: "published",
        categoryId: catColor,
        tags: "davinci resolve, premiere pro, color grading, post-production",
        featuredImage: "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "DaVinci Resolve vs Premiere Pro 2026 | VisionFold Studio",
        seoDescription: "Full technical comparison of DaVinci Resolve vs Adobe Premiere Pro for commercial post-production studios.",
        views: 2890,
        publishedAt: new Date(Date.now() - 12 * 86400_000),
      },
      {
        title: "Film Emulation Mastery: Achieving the 35mm Kodak 2383 Aesthetic",
        slug: "film-emulation-mastery-kodak-2383-aesthetic",
        excerpt: "Why digital footage looks sterile and how to recreate subtractive color density, halation, and gate weave realistically.",
        content: `
# Film Emulation Mastery: Achieving the 35mm Kodak 2383 Aesthetic

Modern digital sensors capture razor-sharp, clinical images. To give videos soul and organic weight, we employ physical film response curves.

## The 4 Pillars of Authentic Film Look:
1. **Subtractive Color Density:** As colors saturate, they become darker and richer, rather than blowing out into neon highlights.
2. **True Halation:** Red/orange scatter around high-contrast specular edges caused by light bouncing off the film base.
3. **Film Grain Distribution:** Grain that lives predominantly in the mid-tones and shadows, rather than uniform digital noise.
4. **Highlight Rolloff:** Smooth soft-shoulder compression simulating photochemical negative response.
        `,
        status: "published",
        categoryId: catColor,
        tags: "film look, kodak 2383, color grading, lut, halation",
        featuredImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "Film Emulation Mastery: 35mm Kodak 2383 Look | VisionFold",
        seoDescription: "Step-by-step masterclass on photochemical film emulation, color density, halation, and highlight rolloff.",
        views: 3120,
        publishedAt: new Date(Date.now() - 20 * 86400_000),
      },
      {
        title: "The Creator Video Production Stack: Gear, AI Tools, and Automation",
        slug: "creator-video-production-stack-ai-tools-automation",
        excerpt: "How top creator studios produce 30+ high-retention assets every month using automated ingest, AI transcripts, and frame reviews.",
        content: `
# The Modern Creator Production Stack

Scaling video production from 1 video per week to 30 high-impact assets per month requires a streamlined pipeline.

## Ingest & Auto-Sync
Using automated folder watchers, multi-camera audio tracks are aligned instantly upon upload.

## AI Rough Cuts & Transcripts
Whisper-based transcript generation allows lightning-fast paper edits and beat-sheet selection before firing up NLE timelines.

## Interactive Client Frame Reviews
Eliminate 50-email revision chains. Time-stamped pinpoint feedback keeps the entire team aligned.
        `,
        status: "published",
        categoryId: catCreator,
        tags: "creator tools, automation, workflows, post-production",
        featuredImage: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "The Creator Video Production Stack & Automation | VisionFold",
        seoDescription: "Discover the software, hardware, and automated review systems used by top creator post-production houses.",
        views: 1980,
        publishedAt: new Date(Date.now() - 30 * 86400_000),
      },
    ]);

    // 12. Automations
    await db.insert(automations).values([
      {
        name: "Auto-Ack New Leads",
        trigger: "lead_created",
        description: "Sends immediate confirmation and project questionnaire to new inquiries.",
        enabled: true,
        config: { autoReplyTemplate: "reply_lead", delaySeconds: 0 },
        lastRunAt: new Date(Date.now() - 3600_000),
      },
      {
        name: "Project Progress Milestone Notification",
        trigger: "project_updated",
        description: "Notifies client via portal message & email when progress exceeds 50% or a new cut is uploaded.",
        enabled: true,
        config: { thresholdProgress: 50, notifyChannels: ["portal", "email"] },
        lastRunAt: new Date(Date.now() - 7200_000),
      },
      {
        name: "Overdue Invoice Reminder",
        trigger: "invoice_overdue",
        description: "Auto-pings clients with polite payment reminder 3 days before and on due date.",
        enabled: true,
        config: { advanceDays: 3, reminderFrequencyDays: 5 },
        lastRunAt: new Date(Date.now() - 14400_000),
      },
      {
        name: "Review Request on Completion",
        trigger: "project_completed",
        description: "Prompts client for a 5-star rating & feedback 24 hours after final project delivery.",
        enabled: true,
        config: { delayHours: 24, rewardCoupon: "VISION10" },
        lastRunAt: new Date(Date.now() - 86400_000),
      },
    ]);

    // 13. Media Library
    await db.insert(media).values([
      {
        name: "visionfold-logo-gold-glow.png",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        type: "image",
        size: 245000,
      },
      {
        name: "cinema-lens-flare-anamorphic.jpg",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
        type: "image",
        size: 1820000,
      },
      {
        name: "studio-editing-suite-davinci.jpg",
        url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop",
        type: "image",
        size: 2150000,
      },
      {
        name: "showreel-intro-stinger.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4",
        type: "video",
        size: 8900000,
      },
    ]);

    // 14. Activity Log
    await db.insert(activity).values([
      {
        actor: "Aliasgar",
        action: "Exported Render",
        details: "Rendered 4K ProRes master for Cyberpunk Neon Beat (v2).",
      },
      {
        actor: "System Automation",
        action: "Lead Processed",
        details: "Auto-qualified lead from David Chen (Vertex Games).",
      },
      {
        actor: "Sarah Jenkins",
        action: "Portal Feedback",
        details: "Added timestamp comment on Cyberpunk Neon Beat at 01:14.",
      },
      {
        actor: "System",
        action: "Invoice Paid",
        details: "Invoice VF-2026-003 marked paid ($1,650.00).",
      },
    ]);

    // 15. Quotas & Limits
    await db.insert(quotas).values({
      storageUsedBytes: "45800000000",
      storageLimitBytes: "107374182400", // 100 GB
      aiTokensUsed: 18500,
      aiTokensLimit: 250000,
      renderHoursUsed: "18.5",
      renderHoursLimit: "50.0",
      activeProjectsLimit: 20,
      alertThresholdPercent: 80,
    });

    // 16. Frame Annotations
    await db.insert(frameAnnotations).values([
      {
        projectId: p1,
        clientId: c1,
        timestamp: "00:42",
        comment: "Speed ramp here feels slightly rushed — can we extend by 4 frames?",
        author: "Sarah Jenkins",
        resolved: true,
      },
      {
        projectId: p1,
        clientId: c1,
        timestamp: "01:14",
        comment: "The drop impact is insane! Let's boost the sub-bass audio cue here.",
        author: "Sarah Jenkins",
        resolved: false,
      },
      {
        projectId: p2,
        clientId: c2,
        timestamp: "00:18",
        comment: "Please blur the background prototype logo on the workstation table.",
        author: "Marcus Vance",
        resolved: true,
      },
    ]);

    // 17. Project Deliverables
    await db.insert(deliverables).values([
      {
        projectId: p1,
        name: "Cyberpunk_Neon_Beat_Master_4K_ProRes422HQ.mov",
        format: "Apple ProRes 422 HQ",
        resolution: "4K UHD (3840x2160)",
        sizeBytes: "14200000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
      },
      {
        projectId: p1,
        name: "Cyberpunk_Neon_Beat_Web_H264_1080p.mp4",
        format: "H.264 / AAC",
        resolution: "1080p Full HD (1920x1080)",
        sizeBytes: "850000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
      },
      {
        projectId: p3,
        name: "SummerDrop_Reel_01_9x16_Vertical.mp4",
        format: "H.264 9:16",
        resolution: "1080x1920 Vertical",
        sizeBytes: "240000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-the-beach-at-sunset-41484-large.mp4",
      },
    ]);

    // 18. Webhooks
    await db.insert(webhooks).values([
      {
        name: "Slack Studio Notifications",
        url: "https://hooks.slack.com/services/T00/B00/XXXXX",
        events: "lead.created,project.completed,invoice.paid",
        secret: "whsec_visionfold_live_01",
        active: true,
        lastTriggeredAt: new Date(Date.now() - 3600_000),
      },
      {
        name: "Make / Zapier Automation Pipeline",
        url: "https://hook.eu1.make.com/custom-webhook-pipeline",
        events: "project.updated,feedback.received",
        secret: "whsec_make_sync_02",
        active: true,
        lastTriggeredAt: new Date(Date.now() - 7200_000),
      },
    ]);

    console.log("[seed] Database successfully seeded with demo dataset!");
  } catch (err) {
    console.error("[seed] Seeding error:", err);
  }
}

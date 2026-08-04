import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  ContentBlock,
  PortfolioItem,
  Message,
  Project,
  Revision,
  Invoice,
  Expense,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  users: User[];
  content_blocks: ContentBlock[];
  portfolio: PortfolioItem[];
  messages: Message[];
  projects: Project[];
  revisions: Revision[];
  invoices: Invoice[];
  expenses: Expense[];
}

function getDefaultDB(): Schema {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('admin123password', salt);
  const clientHashedPassword = bcrypt.hashSync('client123password', salt);

  const adminUser: User = {
    id: 'user_admin_01',
    email: 'visionfoldcreative@gmail.com',
    name: 'Aliasgar',
    role: 'admin',
    company: 'Vision Fold Creative',
    phone: '+91 7725004639',
    createdAt: new Date().toISOString(),
  };

  const sampleClientUser: User = {
    id: 'user_client_01',
    email: 'client@aurastudios.com',
    name: 'Rohan Sharma',
    role: 'client',
    company: 'Aura Apparel',
    phone: '+91 9876543210',
    createdAt: new Date().toISOString(),
  };

  const contentBlocks: ContentBlock[] = [
    // HOME PAGE
    {
      id: 'cb_h_01',
      page: 'home',
      section_key: 'hero_headline',
      type: 'text',
      value: 'Vision Fold Creative',
      order: 1,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_02',
      page: 'home',
      section_key: 'hero_subline',
      type: 'text',
      value: 'Where ideas are shaped. Stories are built. And creativity takes form.',
      order: 2,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_03',
      page: 'home',
      section_key: 'hero_credibility',
      type: 'text',
      value: '2+ years of professional video editing.',
      order: 3,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_04',
      page: 'home',
      section_key: 'creative_vision_heading',
      type: 'text',
      value: 'Creative Vision',
      order: 4,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_05',
      page: 'home',
      section_key: 'creative_vision_text',
      type: 'richtext',
      value:
        'At Vision Fold Creative, we believe every piece of content has a story waiting to be discovered. Our mission is to transform raw ideas, footage, and concepts into powerful visual experiences that capture attention, communicate messages, and help brands grow in the digital world. We combine storytelling, modern editing techniques, visual design, and audience psychology to create content that is not only visually impressive but also built to connect with people.',
      order: 5,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_06',
      page: 'home',
      section_key: 'our_approach_heading',
      type: 'text',
      value: "Our Approach — We Don't Just Edit Videos. We Build Experiences.",
      order: 6,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_07',
      page: 'home',
      section_key: 'our_approach_items',
      type: 'list',
      value: [
        {
          title: '1. Attention',
          description:
            'The first few seconds decide everything. We create strong hooks, engaging openings, and dynamic visuals designed to stop viewers from scrolling.',
        },
        {
          title: '2. Story',
          description:
            'Great content needs direction.',
          bullets: [
            'Clear messaging',
            'Strong pacing',
            'Emotional connection',
            'Purpose-driven visuals',
          ],
        },
        {
          title: '3. Impact',
          description:
            "A successful video should create results. Whether it's growing a creator's audience, promoting a business, or explaining an idea, we focus on content that leaves an impression.",
        },
      ],
      order: 7,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_08',
      page: 'home',
      section_key: 'what_we_create_items',
      type: 'list',
      value: [
        {
          title: 'Social Media Content',
          description: 'Instagram Reels, YouTube Shorts, TikTok Content, Viral-style edits, Creator content',
          icon: 'Video',
        },
        {
          title: 'Brand Content',
          description: 'Product videos, Advertisements, Promotional content, Company videos',
          icon: 'Briefcase',
        },
        {
          title: 'Long-Form Content',
          description: 'YouTube videos, Documentaries, Educational videos, Interviews, Storytelling content',
          icon: 'Film',
        },
      ],
      order: 8,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_09',
      page: 'home',
      section_key: 'editing_philosophy_heading',
      type: 'text',
      value: 'Our Editing Philosophy',
      order: 9,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_10',
      page: 'home',
      section_key: 'editing_philosophy_sub',
      type: 'text',
      value: 'At Vision Fold Creative, every cut has a purpose.',
      order: 10,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_11',
      page: 'home',
      section_key: 'editing_philosophy_list',
      type: 'list',
      value: [
        'Story-first editing',
        'Retention-focused pacing',
        'Modern visual effects',
        'Clean motion design',
        'Professional sound design',
        'Engaging captions',
        'Platform-optimized content',
      ],
      order: 11,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_12',
      page: 'home',
      section_key: 'our_vision_heading',
      type: 'text',
      value: 'Our Vision',
      order: 12,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_h_13',
      page: 'home',
      section_key: 'our_vision_text',
      type: 'text',
      value:
        "To become a creative partner for brands and creators by turning ideas into unforgettable visual stories. We aim to bridge the gap between creativity and strategy — creating content that doesn't just look good, but performs.",
      order: 13,
      visible: true,
      updatedAt: new Date().toISOString(),
    },

    // ABOUT PAGE
    {
      id: 'cb_a_01',
      page: 'about',
      section_key: 'about_title',
      type: 'text',
      value: 'Aliasgar — Video Editor & Content Storytelling Specialist',
      order: 1,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_02',
      page: 'about',
      section_key: 'about_subline',
      type: 'text',
      value: '2+ years of experience helping creators and brands turn footage into results.',
      order: 2,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_03',
      page: 'about',
      section_key: 'about_me_text',
      type: 'richtext',
      value:
        'I am a video editor specializing in creating engaging, retention-focused content for creators, businesses, and brands. My editing approach combines storytelling, modern visual effects, smooth pacing, cinematic elements, and audience psychology to transform raw footage into professional videos that capture attention and keep viewers engaged. I focus on creating videos that are not only visually appealing but also designed to improve watch time, engagement, and brand impact.',
      order: 3,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_04',
      page: 'about',
      section_key: 'editing_style_story',
      type: 'list',
      value: {
        headline: "I don't just cut clips — I build a story.",
        bullets: [
          'Strong opening hooks',
          'Smooth storytelling flow',
          'Engaging pacing',
          'Strategic cuts to maintain attention',
          'Visual moments that support the message',
        ],
      },
      order: 4,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_05',
      page: 'about',
      section_key: 'editing_style_shortform',
      type: 'list',
      value: {
        headline: 'Short-Form Content Editing',
        platforms: 'Instagram Reels, YouTube Shorts, TikTok Videos, Social Media Advertisements, Podcast Clips, Educational Content',
        features: [
          'Attention-grabbing first 3 seconds',
          'Dynamic captions',
          'Animated text effects',
          'Fast-paced cuts',
          'Pattern interrupts',
          'Zooms and camera movements',
          'Sound effects',
          'Background music synchronization',
          'Visual storytelling elements',
          'Retention-focused pacing',
        ],
      },
      order: 5,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_06',
      page: 'about',
      section_key: 'editing_style_longform',
      type: 'list',
      value: {
        headline: 'Long-Form Video Editing',
        platforms: 'YouTube Videos, Documentaries, Business Videos, Tutorials, Interviews, Educational Videos, Marketing Content',
        features: [
          'Complete storytelling structure',
          'Professional cuts',
          'B-roll integration',
          'Audio cleanup',
          'Cinematic color grading',
          'Background music selection',
          'Motion graphics',
          'Smooth transitions',
          'Titles and subtitles',
          'Engaging visual flow',
        ],
      },
      order: 6,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_07',
      page: 'about',
      section_key: 'creative_process_steps',
      type: 'list',
      value: [
        {
          step: '1',
          name: 'Understanding The Vision',
          details: 'Target audience, purpose of the video, brand style, desired emotions.',
        },
        {
          step: '2',
          name: 'Building The Story',
          details: 'Best moments selected, unnecessary parts removed, better pacing created.',
        },
        {
          step: '3',
          name: 'Adding Visual Elements',
          details: 'Captions, motion graphics, effects, transitions, B-roll, sound design.',
        },
        {
          step: '4',
          name: 'Final Polish',
          details: 'Color correction, audio balancing, quality checks, platform optimization.',
        },
      ],
      order: 7,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_08',
      page: 'about',
      section_key: 'editing_tools',
      type: 'list',
      value: ['CapCut', 'AI-powered editing tools', 'Modern motion graphics techniques', 'Advanced storytelling methods'],
      order: 8,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_09',
      page: 'about',
      section_key: 'why_work_with_me',
      type: 'list',
      value: [
        'Focus on audience retention',
        'Storytelling-first approach',
        'Modern social media editing style',
        'Clean and professional visuals',
        'Understanding of current content trends',
        'Creative approach for every project',
        '2+ years of hands-on editing experience',
      ],
      order: 9,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_a_10',
      page: 'about',
      section_key: 'my_goal',
      type: 'text',
      value:
        'To help creators and businesses turn ordinary footage into powerful videos that attract viewers, communicate ideas clearly, and create a lasting impact.',
      order: 10,
      visible: true,
      updatedAt: new Date().toISOString(),
    },

    // SERVICES PAGE
    {
      id: 'cb_s_01',
      page: 'services',
      section_key: 'short_form_rate_per_min',
      type: 'price',
      value: '700',
      order: 1,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_s_02',
      page: 'services',
      section_key: 'long_form_rate_per_min',
      type: 'price',
      value: '700',
      order: 2,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_s_03',
      page: 'services',
      section_key: 'price_disclaimer',
      type: 'text',
      value:
        'This is a starting price. Final quotation depends on: complexity of the edit, raw footage length, motion graphics requirements, and number of revisions.',
      order: 3,
      visible: true,
      updatedAt: new Date().toISOString(),
    },

    // CONTACT PAGE
    {
      id: 'cb_c_01',
      page: 'contact',
      section_key: 'email',
      type: 'text',
      value: 'visionfoldcreative@gmail.com',
      order: 1,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_c_02',
      page: 'contact',
      section_key: 'phone_whatsapp',
      type: 'text',
      value: '+91 7725004639',
      order: 2,
      visible: true,
      updatedAt: new Date().toISOString(),
    },

    // GLOBAL
    {
      id: 'cb_g_01',
      page: 'global',
      section_key: 'footer_copyright',
      type: 'text',
      value: 'Vision Fold Creative © 2026',
      order: 1,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cb_g_02',
      page: 'global',
      section_key: 'footer_credits',
      type: 'text',
      value: 'Built & edited by Aliasgar.',
      order: 2,
      visible: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  const portfolioItems: PortfolioItem[] = [
    {
      id: 'port_01',
      title: 'Viral Brand Reel — Modern Apparel Launch',
      clientName: 'Aura Apparel',
      hideClientName: false,
      category: 'Short Form',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      teaser: 'High-retention Instagram Reel & TikTok edit with kinetic captions, pattern interrupts, and audio sync.',
      fullDescription:
        'Transformed 15 minutes of raw model & lifestyle clips into a fast-paced 45-second vertical showcase. Built around a 3-second hook with pattern interrupts, animated text overlays, custom sound design, and color grading optimized for mobile screens.',
      dateCreated: '2026-05-15',
      toolsUsed: ['CapCut', 'AI Audio Cleanup', 'Motion Design', 'Color Grading'],
      resultsImpact: '+340,000 views in 7 days, 8.4% engagement rate, and a 42% spike in website click-throughs.',
      order: 1,
      featured: true,
    },
    {
      id: 'port_02',
      title: 'Docu-Style YouTube Feature — Founder Journey',
      clientName: 'Nexus Tech',
      hideClientName: false,
      category: 'Long Form',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      teaser: '12-minute long-form documentary narrative featuring cinematic grading, archival B-roll, and story pacing.',
      fullDescription:
        'Distilled 2.5 hours of unscripted founder interviews into a tight, emotionally resonant 12-minute YouTube video. Designed custom lower thirds, integrated archival media, cleansed background audio, and balanced narrative arcs.',
      dateCreated: '2026-06-02',
      toolsUsed: ['Modern Storytelling', 'CapCut Pro', 'Audio Balancing', 'Cinematic Grade'],
      resultsImpact: '78% average watch duration (2x channel baseline) and 12,000+ new subscriber conversions.',
      order: 2,
      featured: true,
    },
    {
      id: 'port_03',
      title: 'High-Convert Product Showcase — Tech Accessories',
      clientName: 'Velo Audio',
      hideClientName: false,
      category: 'Brand Content',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      teaser: 'Sleek, high-impact commercial video with 3D text tracking and punchy sound design.',
      fullDescription:
        'Built a 60-second product spot targeting paid ads on Instagram & Facebook. Emphasized tactile audio effects, macro video speed-ramps, crisp titles, and clear call-to-action cards.',
      dateCreated: '2026-06-20',
      toolsUsed: ['Motion Graphics', 'CapCut', 'Sound Effects', 'Pattern Interrupts'],
      resultsImpact: '3.2x Return on Ad Spend (ROAS) and 45% reduction in cost-per-click.',
      order: 3,
      featured: true,
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj_01',
      title: 'Aura Apparel Summer Reel Campaign',
      clientId: 'user_client_01',
      clientName: 'Rohan Sharma',
      clientEmail: 'client@aurastudios.com',
      category: 'Short Form',
      status: 'delivered',
      description: 'Batch edit of 5 vertical short-form reels for summer collection drop.',
      deliveredFiles: [
        { name: 'Reel_1_SummerDrop_Final.mp4', url: 'https://visionfoldcreative.com/files/reel1.mp4' },
        { name: 'Reel_2_Lifestyle_Final.mp4', url: 'https://visionfoldcreative.com/files/reel2.mp4' },
      ],
      resultsImpact: 'Achieved 420K organic impressions across Instagram & TikTok.',
      startDate: '2026-06-01',
      deliveryDate: '2026-06-10',
      amountINR: 14000,
      createdAt: new Date('2026-06-01').toISOString(),
    },
    {
      id: 'proj_02',
      title: 'Brand Story Interview & B-Roll Master',
      clientId: 'user_client_01',
      clientName: 'Rohan Sharma',
      clientEmail: 'client@aurastudios.com',
      category: 'Long Form',
      status: 'in_review',
      description: '8-minute brand origin story video with custom lower thirds & audio balancing.',
      deliveredFiles: [
        { name: 'BrandStory_Draft_V2.mp4', url: 'https://visionfoldcreative.com/files/brandstory_v2.mp4' },
      ],
      startDate: '2026-07-15',
      amountINR: 21000,
      createdAt: new Date('2026-07-15').toISOString(),
    },
  ];

  const revisions: Revision[] = [
    {
      id: 'rev_01',
      projectId: 'proj_02',
      clientId: 'user_client_01',
      clientName: 'Rohan Sharma',
      comment: 'Please increase the background music volume slightly during the founder transition at 02:15 and slow down the text animation at 04:30.',
      status: 'in_progress',
      createdAt: new Date('2026-07-28T10:30:00Z').toISOString(),
      updatedAt: new Date('2026-07-28T11:00:00Z').toISOString(),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_01',
      invoiceNumber: 'INV-2026-001',
      projectId: 'proj_01',
      clientId: 'user_client_01',
      clientName: 'Rohan Sharma',
      amountINR: 14000,
      dueDate: '2026-06-15',
      status: 'paid',
      description: 'Summer Reel Campaign - Batch of 5 Short Form Videos',
      paidAt: '2026-06-12T14:20:00Z',
      createdAt: new Date('2026-06-01').toISOString(),
    },
    {
      id: 'inv_02',
      invoiceNumber: 'INV-2026-002',
      projectId: 'proj_02',
      clientId: 'user_client_01',
      clientName: 'Rohan Sharma',
      amountINR: 21000,
      dueDate: '2026-08-10',
      status: 'unpaid',
      description: 'Brand Story Interview (8 Minutes) - Long Form Video Edit',
      createdAt: new Date('2026-07-15').toISOString(),
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp_01',
      title: 'CapCut Pro & Motion Asset Subscriptions',
      category: 'Software/Tools',
      amountINR: 2800,
      date: '2026-06-05',
      description: 'Monthly video editor licenses and sound effect libraries.',
      createdAt: new Date('2026-06-05').toISOString(),
    },
    {
      id: 'exp_02',
      title: 'AI Audio Cleanup API Services',
      category: 'Software/Tools',
      amountINR: 1200,
      date: '2026-07-02',
      description: 'Vocal isolation and noise removal software tokens.',
      createdAt: new Date('2026-07-02').toISOString(),
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg_01',
      name: 'Vikram Mehta',
      email: 'vikram@mehtamedia.in',
      phone: '+91 9123456789',
      company: 'Mehta Media',
      projectType: 'Short Form',
      budgetRange: '₹10,000 - ₹25,000',
      deadline: '2026-08-20',
      message: 'Looking for a monthly retainer for 12 YouTube Shorts & Reels with retention-focused editing and fast-paced captions.',
      status: 'new',
      createdAt: new Date('2026-07-30T16:45:00Z').toISOString(),
    },
    {
      id: 'msg_02',
      name: 'Priya Verma',
      email: 'priya@creatorstudio.com',
      phone: '+91 9988776655',
      company: 'Priya Verma Tech',
      projectType: 'Long Form',
      budgetRange: '₹25,000 - ₹50,000',
      deadline: '2026-09-01',
      message: 'Need 3 long form YouTube tech review videos edited with cinematic color grading and motion graphics.',
      status: 'contacted',
      createdAt: new Date('2026-07-25T11:15:00Z').toISOString(),
    },
  ];

  // Map hashed passwords to user credentials store
  return {
    users: [
      { ...adminUser, passwordHash: hashedPassword } as any,
      { ...sampleClientUser, passwordHash: clientHashedPassword } as any,
    ],
    content_blocks: contentBlocks,
    portfolio: portfolioItems,
    messages,
    projects,
    revisions,
    invoices,
    expenses,
  };
}

export class SupabaseDBManager {
  private db: Schema;
  private readonly supabaseClient = getSupabaseClient();
  private readonly useSupabase: boolean;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = this.loadLocalDB();
    this.useSupabase = isSupabaseConfigured() && Boolean(this.supabaseClient);

    if (process.env.NODE_ENV === 'production' && !this.useSupabase) {
      throw new Error(
        '[DB] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured. ' +
        'This app persists data through Supabase only in production; refusing to start ' +
        'with the local-JSON fallback active.'
      );
    }

    if (!this.useSupabase) {
      console.warn(
        '[DB] Supabase is not configured — using local data/db.json for this dev session only. ' +
        'This file is NOT used in production and will not reflect real data.'
      );
    }
  }

  private guardFallback(err: unknown): void {
    if (process.env.NODE_ENV === 'production') {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  private loadLocalDB(): Schema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileData = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileData);
      } catch (err) {
        console.error('Error reading db.json, re-initializing default DB:', err);
      }
    }

    const defaultDB = getDefaultDB();
    this.saveLocalDB(defaultDB);
    return defaultDB;
  }

  private saveLocalDB(db: Schema = this.db) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  private mapUser(user: any): User & { passwordHash?: string } {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
      passwordHash: user.passwordHash || user.password_hash,
    };
  }

  private toUserRow(user: User & { passwordHash?: string }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      created_at: user.createdAt,
      password_hash: user.passwordHash || null,
    };
  }

  private mapContentBlock(row: any): ContentBlock {
    return {
      id: row.id,
      page: row.page,
      section_key: row.section_key,
      type: row.type,
      value: row.value,
      order: row.order,
      visible: row.visible,
      updatedAt: row.updatedAt || row.updated_at,
    };
  }

  private toContentBlockRow(block: Omit<ContentBlock, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }) {
    return {
      id: block.id,
      page: block.page,
      section_key: block.section_key,
      type: block.type,
      value: block.value,
      order: block.order,
      visible: block.visible,
      updated_at: block.updatedAt || new Date().toISOString(),
    };
  }

  private mapPortfolioItem(row: any): PortfolioItem {
    return {
      id: row.id,
      title: row.title,
      clientName: row.clientName || row.client_name || '',
      hideClientName: Boolean(row.hideClientName ?? row.hide_client_name),
      category: row.category,
      thumbnailUrl: row.thumbnailUrl || row.thumbnail_url || '',
      videoUrl: row.videoUrl || row.video_url || '',
      teaser: row.teaser || '',
      fullDescription: row.fullDescription || row.full_description || '',
      dateCreated: row.dateCreated || row.date_created || '',
      toolsUsed: Array.isArray(row.toolsUsed || row.tools_used) ? row.toolsUsed || row.tools_used : [],
      resultsImpact: row.resultsImpact || row.results_impact || '',
      order: row.order ?? 0,
      featured: Boolean(row.featured),
    };
  }

  private toPortfolioRow(item: Omit<PortfolioItem, 'id'> & { id?: string }) {
    return {
      id: item.id,
      title: item.title,
      client_name: item.clientName || '',
      hide_client_name: Boolean(item.hideClientName),
      category: item.category,
      thumbnail_url: item.thumbnailUrl || '',
      video_url: item.videoUrl || '',
      teaser: item.teaser || '',
      full_description: item.fullDescription || '',
      date_created: item.dateCreated || '',
      tools_used: item.toolsUsed || [],
      results_impact: item.resultsImpact || '',
      order: item.order ?? 0,
      featured: Boolean(item.featured),
    };
  }

  private mapMessage(row: any): Message {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company || '',
      projectType: row.projectType || row.project_type || 'Short Form',
      budgetRange: row.budgetRange || row.budget_range || '₹10,000 - ₹25,000',
      deadline: row.deadline || '',
      message: row.message,
      status: row.status || 'new',
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    };
  }

  private toMessageRow(message: Omit<Message, 'id' | 'status' | 'createdAt'> & { id?: string; status?: Message['status']; createdAt?: string }) {
    return {
      id: message.id,
      name: message.name,
      email: message.email,
      phone: message.phone,
      company: message.company || '',
      project_type: (message as any).projectType || '',
      budget_range: (message as any).budgetRange || '',
      deadline: (message as any).deadline || '',
      message: message.message,
      status: message.status || 'new',
      created_at: message.createdAt || new Date().toISOString(),
    };
  }

  private toProjectRow(project: Omit<Project, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    return {
      id: project.id,
      title: project.title,
      client_id: project.clientId,
      client_name: project.clientName,
      client_email: project.clientEmail,
      category: project.category,
      status: project.status,
      description: project.description,
      delivered_files: project.deliveredFiles || [],
      results_impact: project.resultsImpact || '',
      start_date: project.startDate,
      delivery_date: project.deliveryDate || '',
      amount_inr: project.amountINR,
      created_at: project.createdAt || new Date().toISOString(),
    };
  }

  private mapProject(row: any): Project {
    return {
      id: row.id,
      title: row.title,
      clientId: row.clientId || row.client_id,
      clientName: row.clientName || row.client_name,
      clientEmail: row.clientEmail || row.client_email,
      category: row.category,
      status: row.status,
      description: row.description,
      deliveredFiles: row.deliveredFiles || row.delivered_files || [],
      resultsImpact: row.resultsImpact || row.results_impact,
      startDate: row.startDate || row.start_date,
      deliveryDate: row.deliveryDate || row.delivery_date,
      amountINR: row.amountINR || row.amount_inr || 0,
      createdAt: row.createdAt || row.created_at,
    };
  }

  private toRevisionRow(rev: Omit<Revision, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string; createdAt?: string; updatedAt?: string; status?: Revision['status'] }) {
    return {
      id: rev.id,
      project_id: rev.projectId,
      client_id: rev.clientId,
      client_name: rev.clientName,
      comment: rev.comment,
      status: rev.status || 'pending',
      created_at: rev.createdAt || new Date().toISOString(),
      updated_at: rev.updatedAt || new Date().toISOString(),
    };
  }

  private mapRevision(row: any): Revision {
    return {
      id: row.id,
      projectId: row.projectId || row.project_id,
      clientId: row.clientId || row.client_id,
      clientName: row.clientName || row.client_name,
      comment: row.comment,
      status: row.status,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    };
  }

  private toInvoiceRow(inv: Omit<Invoice, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    return {
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      project_id: inv.projectId || '',
      client_id: inv.clientId,
      client_name: inv.clientName,
      amount_inr: inv.amountINR,
      due_date: inv.dueDate,
      status: inv.status,
      description: inv.description,
      paid_at: inv.paidAt || '',
      created_at: inv.createdAt || new Date().toISOString(),
    };
  }

  private mapInvoice(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoiceNumber || row.invoice_number,
      projectId: row.projectId || row.project_id || '',
      clientId: row.clientId || row.client_id,
      clientName: row.clientName || row.client_name,
      amountINR: row.amountINR || row.amount_inr || 0,
      dueDate: row.dueDate || row.due_date,
      status: row.status,
      description: row.description,
      paidAt: row.paidAt || row.paid_at || '',
      createdAt: row.createdAt || row.created_at,
    };
  }

  private toExpenseRow(exp: Omit<Expense, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    return {
      id: exp.id,
      title: exp.title,
      category: exp.category,
      amount_inr: exp.amountINR,
      date: exp.date,
      description: exp.description || '',
      created_at: exp.createdAt || new Date().toISOString(),
    };
  }

  private mapExpense(row: any): Expense {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      amountINR: row.amountINR || row.amount_inr || 0,
      date: row.date,
      description: row.description || '',
      createdAt: row.createdAt || row.created_at,
    };
  }

  async getUsers(): Promise<User[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.users.map((user: any) => {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
      });
    }

    try {
      const { data, error } = await this.supabaseClient.from('users').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const users = (data || []).map((row: any) => this.mapUser(row));
      this.db.users = users as any;
      this.saveLocalDB(this.db);
      return users.map((user: any) => {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
      });
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read users from Supabase; using local storage.', err);
      return this.db.users.map((user: any) => {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
      });
    }
  }

  async findUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | undefined> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    try {
      const { data, error } = await this.supabaseClient.from('users').select('*').eq('email', email).maybeSingle();
      if (error) throw error;
      if (!data) {
        return undefined;
      }
      const user = this.mapUser(data);
      const currentUser = this.db.users.find((u) => u.id === user.id);
      if (!currentUser) {
        this.db.users.push(user as any);
        this.saveLocalDB(this.db);
      }
      return user;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to query user by email via Supabase; using local storage.', err);
      return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
  }

  async findUserById(id: string): Promise<User | undefined> {
    if (!this.useSupabase || !this.supabaseClient) {
      const user = this.db.users.find((u) => u.id === id);
      if (!user) return undefined;
      const { passwordHash, ...safeUser } = user as any;
      return safeUser;
    }

    try {
      const { data, error } = await this.supabaseClient.from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const user = this.mapUser(data);
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to fetch user by id via Supabase; using local storage.', err);
      const user = this.db.users.find((u) => u.id === id);
      if (!user) return undefined;
      const { passwordHash, ...safeUser } = user as any;
      return safeUser;
    }
  }

  async createUser(user: User & { passwordHash: string }): Promise<User> {
    const record = this.toUserRow(user);
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.users.push(user as any);
      this.saveLocalDB(this.db);
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }

    try {
      const { data, error } = await this.supabaseClient.from('users').insert([record]).select('*').maybeSingle();
      if (error) throw error;
      const savedUser = this.mapUser(data);
      this.db.users = [...this.db.users.filter((item) => item.id !== savedUser.id), savedUser as any];
      this.saveLocalDB(this.db);
      const { passwordHash, ...safeUser } = savedUser;
      return safeUser;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to persist user to Supabase; using local storage.', err);
      this.db.users.push(user as any);
      this.saveLocalDB(this.db);
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
  }

  async updateUserPassword(id: string, newHash: string) {
    if (!this.useSupabase || !this.supabaseClient) {
      const user = this.db.users.find((item) => item.id === id);
      if (user) {
        (user as any).passwordHash = newHash;
        this.saveLocalDB(this.db);
      }
      return;
    }

    try {
      const { error } = await this.supabaseClient.from('users').update({ password_hash: newHash }).eq('id', id);
      if (error) throw error;
      const user = this.db.users.find((item) => item.id === id);
      if (user) {
        (user as any).passwordHash = newHash;
        this.saveLocalDB(this.db);
      }
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update password in Supabase; using local storage.', err);
      const user = this.db.users.find((item) => item.id === id);
      if (user) {
        (user as any).passwordHash = newHash;
        this.saveLocalDB(this.db);
      }
    }
  }

  async getContentBlocks(page?: string): Promise<ContentBlock[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      const list = page
        ? this.db.content_blocks.filter((item) => item.page === page)
        : this.db.content_blocks;
      return list.sort((a, b) => a.order - b.order);
    }

    try {
      let query = this.supabaseClient.from('content_blocks').select('*');
      if (page) {
        query = query.eq('page', page);
      }
      const { data, error } = await query.order('order', { ascending: true });
      if (error) throw error;
      const blocks = (data || []).map((row: any) => this.mapContentBlock(row));
      this.db.content_blocks = blocks as any;
      this.saveLocalDB(this.db);
      return blocks;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read content blocks from Supabase; using local storage.', err);
      const list = page
        ? this.db.content_blocks.filter((item) => item.page === page)
        : this.db.content_blocks;
      return list.sort((a, b) => a.order - b.order);
    }
  }

  async updateContentBlock(id: string, updates: Partial<ContentBlock>): Promise<ContentBlock | null> {
    const current = this.db.content_blocks.find((item) => item.id === id);
    if (!current) return null;

    const merged: ContentBlock = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as ContentBlock;

    if (!this.useSupabase || !this.supabaseClient) {
      this.db.content_blocks = this.db.content_blocks.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('content_blocks').update(this.toContentBlockRow(merged)).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapContentBlock(data);
      this.db.content_blocks = this.db.content_blocks.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update content block in Supabase; using local storage.', err);
      this.db.content_blocks = this.db.content_blocks.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async createContentBlock(block: Omit<ContentBlock, 'id' | 'updatedAt'>): Promise<ContentBlock> {
    const newBlock: ContentBlock = {
      ...block,
      id: `cb_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    if (!this.useSupabase || !this.supabaseClient) {
      this.db.content_blocks.push(newBlock);
      this.saveLocalDB(this.db);
      return newBlock;
    }

    try {
      const { data, error } = await this.supabaseClient.from('content_blocks').insert([this.toContentBlockRow(newBlock)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapContentBlock(data);
      this.db.content_blocks.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create content block in Supabase; using local storage.', err);
      this.db.content_blocks.push(newBlock);
      this.saveLocalDB(this.db);
      return newBlock;
    }
  }

  async getPortfolio(): Promise<PortfolioItem[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.portfolio.sort((a, b) => a.order - b.order);
    }

    try {
      const { data, error } = await this.supabaseClient.from('portfolio').select('*').order('order', { ascending: true });
      if (error) throw error;
      const items = (data || []).map((row: any) => this.mapPortfolioItem(row));
      this.db.portfolio = items as any;
      this.saveLocalDB(this.db);
      return items;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read portfolio from Supabase; using local storage.', err);
      return this.db.portfolio.sort((a, b) => a.order - b.order);
    }
  }

  async getPortfolioById(id: string): Promise<PortfolioItem | undefined> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.portfolio.find((item) => item.id === id);
    }

    try {
      const { data, error } = await this.supabaseClient.from('portfolio').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return this.mapPortfolioItem(data);
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read portfolio item from Supabase; using local storage.', err);
      return this.db.portfolio.find((item) => item.id === id);
    }
  }

  async createPortfolioItem(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const newItem: PortfolioItem = { ...item, id: `port_${Date.now()}` };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.portfolio.push(newItem);
      this.saveLocalDB(this.db);
      return newItem;
    }

    try {
      const { data, error } = await this.supabaseClient.from('portfolio').insert([this.toPortfolioRow(newItem)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapPortfolioItem(data);
      this.db.portfolio.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create portfolio item in Supabase; using local storage.', err);
      this.db.portfolio.push(newItem);
      this.saveLocalDB(this.db);
      return newItem;
    }
  }

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | null> {
    const current = this.db.portfolio.find((item) => item.id === id);
    if (!current) return null;
    const merged: PortfolioItem = { ...current, ...updates };

    if (!this.useSupabase || !this.supabaseClient) {
      this.db.portfolio = this.db.portfolio.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('portfolio').update(this.toPortfolioRow(merged)).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapPortfolioItem(data);
      this.db.portfolio = this.db.portfolio.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update portfolio item in Supabase; using local storage.', err);
      this.db.portfolio = this.db.portfolio.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    if (!this.useSupabase || !this.supabaseClient) {
      const initialLen = this.db.portfolio.length;
      this.db.portfolio = this.db.portfolio.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.portfolio.length < initialLen;
    }

    try {
      const { error } = await this.supabaseClient.from('portfolio').delete().eq('id', id);
      if (error) throw error;
      const initialLen = this.db.portfolio.length;
      this.db.portfolio = this.db.portfolio.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.portfolio.length < initialLen;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to delete portfolio item in Supabase; using local storage.', err);
      const initialLen = this.db.portfolio.length;
      this.db.portfolio = this.db.portfolio.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.portfolio.length < initialLen;
    }
  }

  async getMessages(): Promise<Message[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      const { data, error } = await this.supabaseClient.from('messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const messages = (data || []).map((row: any) => this.mapMessage(row));
      this.db.messages = messages as any;
      this.saveLocalDB(this.db);
      return messages;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read messages from Supabase; using local storage.', err);
      return this.db.messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async createMessage(msg: Omit<Message, 'id' | 'status' | 'createdAt'>): Promise<Message> {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    if (!this.useSupabase || !this.supabaseClient) {
      this.db.messages.push(newMsg);
      this.saveLocalDB(this.db);
      return newMsg;
    }

    try {
      const { data, error } = await this.supabaseClient.from('messages').insert([this.toMessageRow(newMsg)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapMessage(data);
      this.db.messages.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create message in Supabase; using local storage.', err);
      this.db.messages.push(newMsg);
      this.saveLocalDB(this.db);
      return newMsg;
    }
  }

  async updateMessageStatus(id: string, status: Message['status']): Promise<Message | null> {
    const current = this.db.messages.find((item) => item.id === id);
    if (!current) return null;
    const merged = { ...current, status };

    if (!this.useSupabase || !this.supabaseClient) {
      this.db.messages = this.db.messages.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('messages').update({ status }).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapMessage(data);
      this.db.messages = this.db.messages.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update message status in Supabase; using local storage.', err);
      this.db.messages = this.db.messages.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async getProjects(clientId?: string): Promise<Project[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      const list = clientId ? this.db.projects.filter((item) => item.clientId === clientId) : this.db.projects;
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      let query = this.supabaseClient.from('projects').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      const projects = (data || []).map((row: any) => this.mapProject(row));
      this.db.projects = projects as any;
      this.saveLocalDB(this.db);
      return projects;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read projects from Supabase; using local storage.', err);
      const list = clientId ? this.db.projects.filter((item) => item.clientId === clientId) : this.db.projects;
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.projects.find((item) => item.id === id);
    }

    try {
      const { data, error } = await this.supabaseClient.from('projects').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      return this.mapProject(data);
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read project from Supabase; using local storage.', err);
      return this.db.projects.find((item) => item.id === id);
    }
  }

  async createProject(proj: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const newProj: Project = { ...proj, id: `proj_${Date.now()}`, createdAt: new Date().toISOString() };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.projects.push(newProj);
      this.saveLocalDB(this.db);
      return newProj;
    }

    try {
      const { data, error } = await this.supabaseClient.from('projects').insert([this.toProjectRow(newProj)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapProject(data);
      this.db.projects.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create project in Supabase; using local storage.', err);
      this.db.projects.push(newProj);
      this.saveLocalDB(this.db);
      return newProj;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const current = this.db.projects.find((item) => item.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.projects = this.db.projects.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('projects').update(this.toProjectRow(merged as any)).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapProject(data);
      this.db.projects = this.db.projects.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update project in Supabase; using local storage.', err);
      this.db.projects = this.db.projects.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async getRevisions(projectId?: string, clientId?: string): Promise<Revision[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      let list = this.db.revisions;
      if (projectId) list = list.filter((item) => item.projectId === projectId);
      if (clientId) list = list.filter((item) => item.clientId === clientId);
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      let query = this.supabaseClient.from('revisions').select('*');
      if (projectId) query = query.eq('project_id', projectId);
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      const revisions = (data || []).map((row: any) => this.mapRevision(row));
      this.db.revisions = revisions as any;
      this.saveLocalDB(this.db);
      return revisions;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read revisions from Supabase; using local storage.', err);
      let list = this.db.revisions;
      if (projectId) list = list.filter((item) => item.projectId === projectId);
      if (clientId) list = list.filter((item) => item.clientId === clientId);
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async createRevision(rev: Omit<Revision, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Revision> {
    const newRev: Revision = {
      ...rev,
      id: `rev_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.revisions.push(newRev);
      this.saveLocalDB(this.db);
      return newRev;
    }

    try {
      const { data, error } = await this.supabaseClient.from('revisions').insert([this.toRevisionRow(newRev)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapRevision(data);
      this.db.revisions.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create revision in Supabase; using local storage.', err);
      this.db.revisions.push(newRev);
      this.saveLocalDB(this.db);
      return newRev;
    }
  }

  async updateRevisionStatus(id: string, status: Revision['status']): Promise<Revision | null> {
    const current = this.db.revisions.find((item) => item.id === id);
    if (!current) return null;
    const merged = { ...current, status, updatedAt: new Date().toISOString() };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.revisions = this.db.revisions.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('revisions').update({ status, updated_at: merged.updatedAt }).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapRevision(data);
      this.db.revisions = this.db.revisions.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update revision status in Supabase; using local storage.', err);
      this.db.revisions = this.db.revisions.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async getInvoices(clientId?: string): Promise<Invoice[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      const list = clientId ? this.db.invoices.filter((item) => item.clientId === clientId) : this.db.invoices;
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      let query = this.supabaseClient.from('invoices').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      const invoices = (data || []).map((row: any) => this.mapInvoice(row));
      this.db.invoices = invoices as any;
      this.saveLocalDB(this.db);
      return invoices;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read invoices from Supabase; using local storage.', err);
      const list = clientId ? this.db.invoices.filter((item) => item.clientId === clientId) : this.db.invoices;
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const newInv: Invoice = { ...inv, id: `inv_${Date.now()}`, createdAt: new Date().toISOString() };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.invoices.push(newInv);
      this.saveLocalDB(this.db);
      return newInv;
    }

    try {
      const { data, error } = await this.supabaseClient.from('invoices').insert([this.toInvoiceRow(newInv)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapInvoice(data);
      this.db.invoices.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create invoice in Supabase; using local storage.', err);
      this.db.invoices.push(newInv);
      this.saveLocalDB(this.db);
      return newInv;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const current = this.db.invoices.find((item) => item.id === id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.invoices = this.db.invoices.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }

    try {
      const { data, error } = await this.supabaseClient.from('invoices').update(this.toInvoiceRow(merged as any)).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapInvoice(data);
      this.db.invoices = this.db.invoices.map((item) => (item.id === id ? saved : item));
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to update invoice in Supabase; using local storage.', err);
      this.db.invoices = this.db.invoices.map((item) => (item.id === id ? merged : item));
      this.saveLocalDB(this.db);
      return merged;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    if (!this.useSupabase || !this.supabaseClient) {
      return this.db.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    try {
      const { data, error } = await this.supabaseClient.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      const expenses = (data || []).map((row: any) => this.mapExpense(row));
      this.db.expenses = expenses as any;
      this.saveLocalDB(this.db);
      return expenses;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to read expenses from Supabase; using local storage.', err);
      return this.db.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }

  async createExpense(exp: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const newExp: Expense = { ...exp, id: `exp_${Date.now()}`, createdAt: new Date().toISOString() };
    if (!this.useSupabase || !this.supabaseClient) {
      this.db.expenses.push(newExp);
      this.saveLocalDB(this.db);
      return newExp;
    }

    try {
      const { data, error } = await this.supabaseClient.from('expenses').insert([this.toExpenseRow(newExp)]).select('*').maybeSingle();
      if (error) throw error;
      const saved = this.mapExpense(data);
      this.db.expenses.push(saved);
      this.saveLocalDB(this.db);
      return saved;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to create expense in Supabase; using local storage.', err);
      this.db.expenses.push(newExp);
      this.saveLocalDB(this.db);
      return newExp;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    if (!this.useSupabase || !this.supabaseClient) {
      const initialLen = this.db.expenses.length;
      this.db.expenses = this.db.expenses.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.expenses.length < initialLen;
    }

    try {
      const { error } = await this.supabaseClient.from('expenses').delete().eq('id', id);
      if (error) throw error;
      const initialLen = this.db.expenses.length;
      this.db.expenses = this.db.expenses.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.expenses.length < initialLen;
    } catch (err) {
      this.guardFallback(err);
      console.warn('[DB] Unable to delete expense in Supabase; using local storage.', err);
      const initialLen = this.db.expenses.length;
      this.db.expenses = this.db.expenses.filter((item) => item.id !== id);
      this.saveLocalDB(this.db);
      return this.db.expenses.length < initialLen;
    }
  }
}

export const dbManager = new SupabaseDBManager();

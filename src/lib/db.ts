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

export class DBManager {
  private db: Schema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileData = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(fileData);
      } catch (err) {
        console.error('Error reading db.json, re-initializing default DB:', err);
        this.db = getDefaultDB();
        this.save();
      }
    } else {
      this.db = getDefaultDB();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  // Users
  getUsers(): User[] {
    return this.db.users.map(({ passwordHash, ...u }: any) => u);
  }

  findUserByEmail(email: string): (User & { passwordHash?: string }) | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) return undefined;
    const { passwordHash, ...safeUser } = user as any;
    return safeUser;
  }

  createUser(user: User & { passwordHash: string }): User {
    this.db.users.push(user);
    this.save();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  updateUserPassword(id: string, newHash: string) {
    const u = this.db.users.find((x) => x.id === id);
    if (u) {
      (u as any).passwordHash = newHash;
      this.save();
    }
  }

  // Content Blocks
  getContentBlocks(page?: string): ContentBlock[] {
    if (page) {
      return this.db.content_blocks
        .filter((cb) => cb.page === page)
        .sort((a, b) => a.order - b.order);
    }
    return this.db.content_blocks.sort((a, b) => a.order - b.order);
  }

  updateContentBlock(id: string, updates: Partial<ContentBlock>): ContentBlock | null {
    const idx = this.db.content_blocks.findIndex((cb) => cb.id === id);
    if (idx === -1) return null;
    this.db.content_blocks[idx] = {
      ...this.db.content_blocks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.db.content_blocks[idx];
  }

  createContentBlock(block: Omit<ContentBlock, 'id' | 'updatedAt'>): ContentBlock {
    const newBlock: ContentBlock = {
      ...block,
      id: `cb_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.db.content_blocks.push(newBlock);
    this.save();
    return newBlock;
  }

  // Portfolio
  getPortfolio(): PortfolioItem[] {
    return this.db.portfolio.sort((a, b) => a.order - b.order);
  }

  getPortfolioById(id: string): PortfolioItem | undefined {
    return this.db.portfolio.find((p) => p.id === id);
  }

  createPortfolioItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
    const newItem: PortfolioItem = {
      ...item,
      id: `port_${Date.now()}`,
    };
    this.db.portfolio.push(newItem);
    this.save();
    return newItem;
  }

  updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): PortfolioItem | null {
    const idx = this.db.portfolio.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.db.portfolio[idx] = { ...this.db.portfolio[idx], ...updates };
    this.save();
    return this.db.portfolio[idx];
  }

  deletePortfolioItem(id: string): boolean {
    const initialLen = this.db.portfolio.length;
    this.db.portfolio = this.db.portfolio.filter((p) => p.id !== id);
    this.save();
    return this.db.portfolio.length < initialLen;
  }

  // Messages / Inquiries
  getMessages(): Message[] {
    return this.db.messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createMessage(msg: Omit<Message, 'id' | 'status' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    this.db.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  updateMessageStatus(id: string, status: Message['status']): Message | null {
    const msg = this.db.messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.status = status;
    this.save();
    return msg;
  }

  // Projects
  getProjects(clientId?: string): Project[] {
    if (clientId) {
      return this.db.projects.filter((p) => p.clientId === clientId);
    }
    return this.db.projects.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getProjectById(id: string): Project | undefined {
    return this.db.projects.find((p) => p.id === id);
  }

  createProject(proj: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProj: Project = {
      ...proj,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.db.projects.push(newProj);
    this.save();
    return newProj;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const idx = this.db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.db.projects[idx] = { ...this.db.projects[idx], ...updates };
    this.save();
    return this.db.projects[idx];
  }

  // Revisions
  getRevisions(projectId?: string, clientId?: string): Revision[] {
    let list = this.db.revisions;
    if (projectId) {
      list = list.filter((r) => r.projectId === projectId);
    }
    if (clientId) {
      list = list.filter((r) => r.clientId === clientId);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createRevision(rev: Omit<Revision, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Revision {
    const newRev: Revision = {
      ...rev,
      id: `rev_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.revisions.push(newRev);
    this.save();
    return newRev;
  }

  updateRevisionStatus(id: string, status: Revision['status']): Revision | null {
    const rev = this.db.revisions.find((r) => r.id === id);
    if (!rev) return null;
    rev.status = status;
    rev.updatedAt = new Date().toISOString();
    this.save();
    return rev;
  }

  // Invoices
  getInvoices(clientId?: string): Invoice[] {
    if (clientId) {
      return this.db.invoices.filter((i) => i.clientId === clientId);
    }
    return this.db.invoices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const newInv: Invoice = {
      ...inv,
      id: `inv_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.db.invoices.push(newInv);
    this.save();
    return newInv;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const idx = this.db.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.db.invoices[idx] = { ...this.db.invoices[idx], ...updates };
    this.save();
    return this.db.invoices[idx];
  }

  // Expenses
  getExpenses(): Expense[] {
    return this.db.expenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  createExpense(exp: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const newExp: Expense = {
      ...exp,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.db.expenses.push(newExp);
    this.save();
    return newExp;
  }

  deleteExpense(id: string): boolean {
    const init = this.db.expenses.length;
    this.db.expenses = this.db.expenses.filter((e) => e.id !== id);
    this.save();
    return this.db.expenses.length < init;
  }
}

export const dbManager = new DBManager();

export type CmsPageStatus = 'draft' | 'published' | 'scheduled';

export type CmsBlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'video'
  | 'gallery'
  | 'cta'
  | 'testimonial'
  | 'columns'
  | 'spacer'
  | 'pricing';

export interface CmsBlock {
  id: string;
  type: CmsBlockType;
  order: number;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface CmsSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonical?: string;
  slug?: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: CmsPageStatus;
  publishedAt?: string | null;
  scheduledFor?: string | null;
  seo: CmsSeo;
  blocks: CmsBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CmsRevision {
  id: string;
  pageId: string;
  snapshot: CmsPage;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CmsNavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  openInNewTab?: boolean;
  children?: CmsNavItem[];
}

export interface CmsStore {
  pages: CmsPage[];
  revisions: CmsRevision[];
  savedBlocks: Array<{
    id: string;
    name: string;
    type: CmsBlockType;
    content: Record<string, unknown>;
    settings?: Record<string, unknown>;
  }>;
  nav: CmsNavItem[];
}

export const DEFAULT_CMS_STORE: CmsStore = {
  pages: [],
  revisions: [],
  savedBlocks: [],
  nav: [
    { id: 'nav_home', label: 'Home', href: '/', order: 0 },
    { id: 'nav_work', label: 'Work', href: '/work', order: 1 },
    { id: 'nav_services', label: 'Services', href: '/services', order: 2 },
    { id: 'nav_contact', label: 'Contact', href: '/contact', order: 3 },
  ],
};

export const BLOCK_CATALOG: Array<{ type: CmsBlockType; label: string; defaults: Record<string, unknown> }> = [
  { type: 'heading', label: 'Heading', defaults: { text: 'Section title', level: 2 } },
  { type: 'text', label: 'Text', defaults: { html: 'Write something memorable.' } },
  { type: 'image', label: 'Image', defaults: { url: '', alt: '', caption: '' } },
  { type: 'video', label: 'Video', defaults: { url: '', poster: '' } },
  { type: 'gallery', label: 'Gallery', defaults: { urls: [] as string[] } },
  { type: 'cta', label: 'CTA button', defaults: { label: 'Get a quote', href: '/contact' } },
  { type: 'testimonial', label: 'Testimonial', defaults: { quote: '', author: '', role: '' } },
  {
    type: 'columns',
    label: 'Columns',
    defaults: { columns: [{ text: 'Column A' }, { text: 'Column B' }] },
  },
  { type: 'spacer', label: 'Spacer', defaults: { height: 48 } },
  {
    type: 'pricing',
    label: 'Pricing',
    defaults: { title: 'Short form', price: '₹700/min', features: ['Retention edit', '2 revisions'] },
  },
];

# VisionFold Creative Architecture

## Overview

VisionFold Creative is a premium video production studio website with a comprehensive admin panel. The application is built with React 19, TypeScript, Express.js, and integrates with OpenRouter AI for content generation.

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **Recharts** - Admin dashboard charts
- **Three.js** - 3D hero animations

### Backend
- **Express.js** - API server
- **Vite** - Build tool
- **JWT** - Authentication
- **Zod** - Validation
- **Helmet** - Security headers
- **Rate Limiting** - Abuse prevention

### External Services
- **OpenRouter** - AI content generation
- **Supabase** - Database (optional)
- **Resend** - Email notifications
- **Vercel** - Deployment

## Directory Structure

```
/
├── api/                    # API handler for Vercel
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── Admin/          # Admin panel components
│   │   │   ├── views/       # Admin views (Dashboard, Settings, etc.)
│   │   │   └── ui.tsx       # Re-exported UI components
│   │   ├── PublicPages/     # Public-facing pages
│   │   └── ErrorPages/      # Error page components
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core utilities
│   │   ├── ui/              # Premium UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── motion/          # Animation variants
│   │   │   └── variants.ts
│   │   ├── api.ts           # API client
│   │   ├── adminApi.ts      # Admin API client
│   │   ├── db.ts           # Database manager
│   │   ├── errors.ts        # Error types
│   │   ├── openrouter.ts   # OpenRouter AI integration
│   │   ├── storage.ts      # Storage provider
│   │   ├── supabase.ts     # Supabase client
│   │   ├── utils.ts        # Utility functions
│   │   └── validation.ts   # Zod schemas
│   └── types.ts             # Type exports
├── server.ts                # Express server
├── api/index.ts             # Vercel serverless handler
└── vite.config.ts           # Vite configuration
```

## API Design

### Authentication
```
POST /api/auth/login     - Login with email/password
POST /api/auth/logout    - Clear session
GET  /api/auth/me        - Get current user
```

### Content Management
```
GET  /api/content         - Get content blocks
PUT  /api/content/:id     - Update content block
POST /api/content         - Create content block
```

### Portfolio
```
GET    /api/portfolio          - List portfolio items
GET    /api/portfolio/:id     - Get portfolio item
POST   /api/portfolio          - Create portfolio item
PUT    /api/portfolio/:id     - Update portfolio item
DELETE /api/portfolio/:id      - Delete portfolio item
```

### Messages
```
GET  /api/messages        - List messages
POST /api/messages         - Submit contact form
```

### Projects & Clients
```
GET/POST /api/projects      - List/create projects
GET/PUT  /api/projects/:id - Get/update project
GET/POST /api/clients      - List/create clients
```

### Invoices & Expenses
```
GET/POST    /api/invoices    - List/create invoices
GET/PUT/DEL /api/invoices/:id
GET/POST    /api/expenses    - List/create expenses
```

### AI Features
```
POST /api/ai/generate        - AI content generation
POST /api/ai/chat           - AI chat assistant
POST /api/ai/inquiry-assist  - Help with inquiries
POST /api/ai/insights       - Business insights
```

### File Upload
```
POST /api/upload            - Upload file (admin only)
```

## Data Flow

### Request Lifecycle
1. Client sends request to Express server
2. JWT token validated (if required)
3. Request body validated with Zod
4. Business logic executed
5. Database updated (if applicable)
6. Response formatted and returned

### Authentication Flow
1. User submits login form
2. Server validates credentials
3. JWT token generated with user ID
4. Token stored in HTTP-only cookie
5. Subsequent requests include token
6. Middleware validates token on protected routes

## Security Architecture

### Rate Limiting
- Auth routes: 10 requests/15 minutes
- Contact form: 5 requests/hour
- AI endpoints: 20 requests/minute
- General API: 100 requests/minute

### Security Headers
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Helmet for HTTP security headers

### Input Validation
All user input is validated using Zod schemas:
- Request body validation
- Query parameter validation
- URL parameter validation
- File type and size validation

## State Management

### React Context Providers
- **AuthProvider** - Authentication state
- **AdminProvider** - Admin settings and metrics
- **ContentProvider** - Site content blocks
- **SfxProvider** - Sound effects

### Local Storage
- Admin settings (visionfold_settings_v2)
- Baseline rate
- Addon rates
- Metrics configuration

## AI Integration

### OpenRouter
- Secure API key stored in environment
- Server-side proxy for AI requests
- Rate limiting for AI endpoints
- Token usage tracking

### Available Models
- anthropic/claude-3-haiku
- anthropic/claude-3-sonnet
- openai/gpt-4-turbo

## Deployment

### Vercel
- Serverless functions via `api/index.ts`
- Static assets served from `dist/`
- SPA routing handled by Vercel rewrite

### Environment Variables
- `JWT_SECRET` - JWT signing key (required in production)
- `OPENROUTER_API_KEY` - OpenRouter API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `RESEND_API_KEY` - Resend email API key
- `NOTIFICATION_EMAIL` - Admin notification email

## Performance Optimizations

### Code Splitting
- Three.js loaded separately
- Admin panel lazy-loaded
- Heavy charts lazy-loaded

### Caching
- Static asset caching
- API response caching where appropriate
- ETags for conditional requests

### Optimization
- Image lazy loading
- Video lazy loading
- Virtual scrolling for long lists
- Debounced search inputs

## Accessibility

### Standards
- WCAG 2.1 AA compliance target
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Reduced motion support

### Tools
- axe-core for automated testing
- Prettier for consistent formatting
- ESLint for code quality

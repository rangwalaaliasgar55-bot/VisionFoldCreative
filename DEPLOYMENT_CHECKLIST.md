# Deployment Checklist

Use this checklist before deploying VisionFold Creative to production.

## Pre-Deployment

### Code Quality
- [ ] All tests pass (`npm run test:run`)
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in dev server
- [ ] Bundle size within budget

### Testing
- [ ] Test all major user flows
- [ ] Test admin panel functionality
- [ ] Test contact form submission
- [ ] Test AI features
- [ ] Test authentication flow
- [ ] Test mobile responsiveness

### Security
- [ ] Security audit complete (`npm audit`)
- [ ] No critical vulnerabilities
- [ ] API keys not in code
- [ ] Rate limiting enabled
- [ ] CORS configured correctly

## Environment Setup

### Required Variables
```bash
# JWT Secret (generate secure random string)
JWT_SECRET=<your-secure-secret>

# OpenRouter for AI features
OPENROUTER_API_KEY=<your-openrouter-key>

# Optional: Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>

# Email notifications
RESEND_API_KEY=<your-resend-key>
NOTIFICATION_EMAIL=<admin@yourdomain.com>
```

### Vercel Configuration
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm ci`

## Deployment Steps

### 1. Prepare
```bash
# Pull latest changes
git checkout main
git pull origin main

# Create deployment branch
git checkout -b deploy/preview
```

### 2. Test Locally
```bash
# Install dependencies
npm ci

# Run full validation
npm run lint
npm run test:run
npm run build

# Test production build
npm run start
```

### 3. Deploy
```bash
# Push to trigger deployment
git push origin deploy/preview

# Or deploy via Vercel CLI
vercel --prod
```

### 4. Verify
- [ ] Site loads correctly
- [ ] Admin panel accessible
- [ ] Contact form works
- [ ] AI features functional
- [ ] No console errors
- [ ] SSL certificate active

## Post-Deployment

### Monitoring
- [ ] Check Vercel deployment logs
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify backup system

### Verification
- [ ] All forms functional
- [ ] Authentication works
- [ ] AI responses correct
- [ ] Analytics tracking
- [ ] Performance metrics

## Rollback Procedure

If issues are detected:

### Quick Rollback
```bash
# Via Vercel CLI
vercel rollback

# Or via dashboard
# Vercel Dashboard → Deployments → Select previous → Actions → Promote
```

### Manual Fix
1. Identify the issue
2. Fix in development
3. Test thoroughly
4. Deploy fix
5. Monitor for resolution

## Emergency Contacts

- DevOps Lead: [contact]
- Security Issues: [security-email]
- Vercel Support: vercel.com/support

## Verification Script

Run this after deployment:

```bash
# Test endpoints
curl -I https://your-domain.com
curl -I https://your-domain.com/api/health
curl -X POST https://your-domain.com/api/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"1234567890","message":"Test message"}'
```

Expected responses:
- `/` → 200 OK
- `/api/health` → 200 OK
- `/api/messages` → 201 Created or rate limit message

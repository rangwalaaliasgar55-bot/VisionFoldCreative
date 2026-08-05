# Quality Standards

This document defines the quality standards for VisionFold Creative codebase.

## Code Quality

### TypeScript Standards
- All components must be properly typed with explicit interfaces
- Use strict TypeScript checking (`strict: true` in tsconfig)
- No `any` types unless absolutely necessary
- Export types for all public interfaces

### Component Standards
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Co-locate component-specific styles

### Testing Requirements
- Minimum 90% statement coverage for lib code
- All API endpoints must have tests
- All utility functions must have tests
- Critical paths must have integration tests

## Performance Budgets

### Bundle Size
- Main bundle: < 1MB gzipped
- Largest chunk: < 500KB gzipped
- Code splitting for heavy dependencies (Three.js, Recharts)

### Runtime Performance
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 200ms

## Security Standards

### Input Validation
- All user input must be validated with Zod schemas
- Never trust client-side validation alone
- Sanitize HTML content to prevent XSS
- Use parameterized queries for database operations

### Authentication
- JWT tokens with 24h expiry
- Secure HTTP-only cookies for session
- Rate limiting on auth endpoints
- CSRF protection on state-changing operations

### Dependencies
- Run `npm audit` before each release
- Pin critical dependencies to exact versions
- Review breaking changes before updating
- Remove unused dependencies regularly

## Code Review Checklist

### Before Merging
- [ ] TypeScript compiles without errors
- [ ] All tests pass (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings
- [ ] Accessibility check (axe-core)
- [ ] Security scan (npm audit)
- [ ] Bundle size within budget

### Style Guide
- Use Prettier for formatting
- ESLint for code quality
- Descriptive commit messages (conventional commits)
- Document complex logic with comments
- No commented-out code in final commits

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance tasks
- `refactor/description` - Code refactoring

### Commit Messages
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting, no code change
refactor: code change that neither fixes nor adds
test: adding tests
chore: maintenance tasks
```

## Error Handling

### Frontend
- Wrap critical sections in ErrorBoundary
- Provide user-friendly error messages
- Log errors to monitoring service (Sentry)
- Implement retry logic for transient failures

### Backend
- Return appropriate HTTP status codes
- Include error details in response body
- Log errors with correlation IDs
- Never expose sensitive information in errors

## Monitoring & Observability

### Metrics to Track
- Error rate by endpoint
- Response time percentiles (p50, p95, p99)
- Active users
- API usage by endpoint
- AI token consumption

### Alerts
- Error rate > 5%
- Response time p95 > 2s
- API usage > 90% of rate limit
- AI costs > 80% of budget

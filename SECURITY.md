# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | ✅ Currently supported |
| 1.x     | ⚠️ Security updates only |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

### How to Report
1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly at [visionfoldcreative@gmail.com]
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Assessment**: Within 1 week
- **Fix Development**: Varies by complexity
- **Disclosure**: After fix is deployed

## Security Best Practices

### For Users

#### Password Security
- Use strong, unique passwords
- Enable two-factor authentication where available
- Never share your credentials
- Use a password manager

#### API Keys
- Keep API keys confidential
- Never commit keys to version control
- Rotate keys periodically
- Use environment variables

### For Developers

#### Input Validation
```typescript
// Always validate user input with Zod
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const validated = userSchema.safeParse(userInput);
```

#### Authentication
```typescript
// Use JWT with secure options
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Set secure cookies
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});
```

#### SQL Injection Prevention
```typescript
// Use parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

#### XSS Prevention
```typescript
// Sanitize HTML content
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

## Security Headers

The application includes security headers via Helmet:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 requests | 15 minutes |
| `/api/messages` | 5 requests | 1 hour |
| `/api/ai/*` | 20 requests | 1 minute |
| `*` (general) | 100 requests | 1 minute |

## Environment Variables

Required security-sensitive variables:

```bash
# Required in production
JWT_SECRET=<secure-random-string>

# Optional external services
OPENROUTER_API_KEY=<your-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
RESEND_API_KEY=<your-resend-key>
```

## Data Protection

### Sensitive Data
- API keys stored in environment variables
- Passwords hashed with bcrypt
- JWT tokens with expiration
- Cookies with httpOnly and secure flags

### Database
- Parameterized queries only
- Soft deletes for data recovery
- Regular backups to secure storage
- Access logging for admin operations

## Security Checklist

Before deploying:

- [ ] JWT_SECRET is set in production
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] Input validation is in place
- [ ] API keys are not in code
- [ ] Error messages don't expose sensitive info
- [ ] HTTPS is enforced
- [ ] Admin routes require authentication
- [ ] File upload validation is strict

## Security Updates

Subscribe to security advisories:
- GitHub Security Advisories
- npm security alerts
- Dependency update notifications

## Acknowledgments

Thank you to all security researchers and contributors who help keep VisionFold Creative secure.

# Vision Fold Creative Studio - API Routes Documentation

## Overview
This document describes all available API endpoints for the Vision Fold Creative Studio admin dashboard and public website.

## Authentication

### Credentials for Testing
- **Admin Email:** `visionfoldcreative@gmail.com`
- **Admin Password:** `admin123password`

### Auth Endpoints

#### POST /api/auth/login
Authenticate with email and password. Returns JWT token and user data.

**Request:**
```json
{
  "email": "visionfoldcreative@gmail.com",
  "password": "admin123password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_admin_01",
    "email": "visionfoldcreative@gmail.com",
    "name": "Aliasgar",
    "role": "admin",
    "company": "Vision Fold Creative",
    "phone": "+91 7725004639",
    "createdAt": "2026-08-04T15:04:45.833Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Email and password are required
- `401` - Invalid email or password

---

#### GET /api/auth/me
Get current authenticated user. Requires valid session cookie or Authorization header.

**Response (200):**
```json
{
  "user": {
    "id": "user_admin_01",
    "email": "visionfoldcreative@gmail.com",
    "name": "Aliasgar",
    "role": "admin",
    ...
  }
}
```

**Errors:**
- `401` - Authentication required

---

#### POST /api/auth/logout
Logout the current user. Clears authentication session.

**Response (200):**
```json
{ "success": true }
```

---

#### POST /api/auth/register
Register a new client account.

**Request:**
```json
{
  "email": "newclient@example.com",
  "password": "SecurePassword123",
  "name": "Client Name",
  "company": "Client Company (optional)",
  "phone": "+91 9999999999 (optional)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_client_xxx",
    "email": "newclient@example.com",
    "name": "Client Name",
    "role": "client",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Email, password, and name are required
- `400` - An account with this email already exists

---

## Public Content Routes

### GET /api/content
Retrieve all content blocks (public endpoint, no auth required).

**Query Parameters:**
- `page` (optional) - Filter by page (home, about, services, portfolio, contact, global)
- `visible` (optional) - Filter by visibility (true/false)

**Response (200):**
```json
[
  {
    "id": "content_001",
    "page": "home",
    "section_key": "hero_title",
    "type": "text",
    "value": "Hero Title Text",
    "order": 1,
    "visible": true,
    "updatedAt": "2026-08-04T15:04:45.833Z"
  },
  ...
]
```

---

### GET /api/portfolio
Retrieve portfolio items (public endpoint, no auth required).

**Query Parameters:**
- `featured` (optional) - Filter by featured status (true/false)
- `category` (optional) - Filter by category

**Response (200):**
```json
[
  {
    "id": "port_001",
    "title": "Project Title",
    "clientName": "Client Name",
    "hideClientName": false,
    "category": "Short Form",
    "thumbnailUrl": "https://...",
    "videoUrl": "https://...",
    "teaser": "Short description",
    "fullDescription": "Full description",
    "dateCreated": "2026-05-15",
    "toolsUsed": ["CapCut", "Premiere Pro"],
    "resultsImpact": "Results description",
    "order": 1,
    "featured": true
  },
  ...
]
```

---

## Admin-Only Routes

All admin routes require authentication. Pass the JWT token via:
- Cookie: `vf_token`
- Header: `Authorization: Bearer <token>`

---

### Messages (Leads)

#### GET /api/messages
Retrieve all contact form messages.

**Response (200):**
```json
[
  {
    "id": "msg_001",
    "name": "Lead Name",
    "email": "lead@example.com",
    "phone": "+91 9999999999",
    "company": "Company Name",
    "projectType": "Short Form",
    "budgetRange": "₹10,000 - ₹25,000",
    "deadline": "2026-08-20",
    "message": "Lead message content",
    "status": "new",
    "createdAt": "2026-07-30T16:45:00Z"
  },
  ...
]
```

**Errors:**
- `401` - Authentication required

---

#### POST /api/messages
Create a new contact form message (public, rate-limited).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9999999999",
  "company": "Company (optional)",
  "projectType": "Short Form",
  "budgetRange": "₹10,000 - ₹25,000",
  "deadline": "2026-08-20 (optional)",
  "message": "Message content"
}
```

**Response (201):**
```json
{
  "id": "msg_new",
  "name": "John Doe",
  ...
}
```

**Errors:**
- `400` - Validation error
- `429` - Rate limit exceeded (5 messages per hour)

---

#### PATCH /api/messages/:id
Update message status.

**Request:**
```json
{
  "status": "contacted" // or "closed"
}
```

**Response (200):** Updated message object

---

### Projects

#### GET /api/projects
Retrieve all projects (admin only).

**Response (200):**
```json
[
  {
    "id": "proj_001",
    "title": "Project Title",
    "clientId": "user_client_01",
    "clientName": "Client Name",
    "clientEmail": "client@example.com",
    "category": "Video Editing",
    "status": "in_progress",
    "description": "Project description",
    "startDate": "2026-07-01",
    "deliveryDate": "2026-08-15",
    "amountINR": 50000,
    "createdAt": "2026-07-01T10:00:00Z"
  },
  ...
]
```

---

#### POST /api/projects
Create a new project.

**Request:**
```json
{
  "title": "New Project",
  "clientId": "user_client_01",
  "category": "Video Editing",
  "description": "Description",
  "startDate": "2026-08-15",
  "deliveryDate": "2026-09-15",
  "amountINR": 50000
}
```

**Response (201):** Created project object

---

#### PUT /api/projects/:id
Update an existing project.

**Response (200):** Updated project object

---

#### DELETE /api/projects/:id
Delete a project.

**Response (200):**
```json
{ "success": true }
```

---

### Clients

#### GET /api/clients
Retrieve all client users (admin only).

**Response (200):** Array of user objects

---

### Invoices

#### GET /api/invoices
Retrieve all invoices (admin only).

**Response (200):**
```json
[
  {
    "id": "inv_001",
    "invoiceNumber": "INV-2026-001",
    "projectId": "proj_001",
    "clientId": "user_client_01",
    "clientName": "Client Name",
    "amountINR": 50000,
    "dueDate": "2026-08-20",
    "status": "unpaid",
    "description": "Description",
    "paidAt": null,
    "createdAt": "2026-07-01T10:00:00Z"
  },
  ...
]
```

---

#### POST /api/invoices
Create a new invoice.

**Request:**
```json
{
  "invoiceNumber": "INV-2026-003",
  "clientId": "user_client_01",
  "clientName": "Client Name",
  "amountINR": 50000,
  "dueDate": "2026-08-20",
  "description": "Invoice description"
}
```

**Response (201):** Created invoice object

---

#### PATCH /api/invoices/:id
Update invoice status.

**Request:**
```json
{
  "status": "paid", // or "unpaid" or "overdue"
  "paidAt": "2026-08-15T10:00:00Z" // only if marking as paid
}
```

**Response (200):** Updated invoice object

---

### Expenses

#### GET /api/expenses
Retrieve all expenses (admin only).

**Response (200):**
```json
[
  {
    "id": "exp_001",
    "title": "Software License",
    "category": "Software/Tools",
    "amountINR": 2800,
    "date": "2026-06-05",
    "description": "Monthly subscriptions",
    "createdAt": "2026-06-05T10:00:00Z"
  },
  ...
]
```

**Valid Categories:**
- Software/Tools
- Subcontracting
- Equipment
- Marketing
- Operations

---

#### POST /api/expenses
Create a new expense.

**Request:**
```json
{
  "title": "New Expense",
  "category": "Software/Tools",
  "amountINR": 2000,
  "date": "2026-08-04",
  "description": "Expense description"
}
```

**Response (201):** Created expense object

---

## Content Management Routes (Admin)

### GET /api/content
Retrieve content blocks (admin can see all, public sees only visible ones).

---

### POST /api/content
Create new content block.

**Request:**
```json
{
  "page": "home",
  "section_key": "hero_title",
  "type": "text",
  "value": "Content value",
  "order": 1,
  "visible": true
}
```

**Valid Pages:** home, about, services, portfolio, contact, global

**Valid Types:** text, richtext, image, list, price

---

### PUT /api/content/:id
Update existing content block.

---

### DELETE /api/content/:id
Delete content block.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required or failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

---

## Rate Limiting

- **Auth Routes:** 10 requests per 15 minutes per IP
- **Contact Form:** 5 messages per hour per IP
- **AI Routes:** 20 requests per minute per IP

---

## Development Notes

- All timestamps are in ISO 8601 format with UTC timezone
- Dates can be in YYYY-MM-DD or ISO 8601 format
- All monetary amounts are in INR (Indian Rupees)
- Authentication tokens expire after 7 days
- Session cookies are httpOnly and secure in production

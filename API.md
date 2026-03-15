# API Documentation

Complete reference for all backend API endpoints.

## Authentication

### POST /api/auth/signup

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "name": "John Doe",
  "role": "client",
  "phone": "+1-555-0000",
  "company": "Company Inc"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "success": true,
    "token": "eyJhbGc...",
    "user": {
      "_id": "user-1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "client",
      "company": "Company Inc"
    }
  }
}
```

**Validation:**
- Email must be valid format
- Password must be 8+ characters with uppercase, lowercase, numbers
- Role must be "admin" or "client"
- Email must not already exist

---

### POST /api/auth/login

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "success": true,
    "token": "eyJhbGc...",
    "user": {
      "_id": "user-1",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "client"
    }
  }
}
```

**Errors:**
- 400: Email and password required
- 401: Invalid email or password

---

## Projects

All project endpoints require valid JWT token in `Authorization: Bearer <token>` header.

### GET /api/projects

Get all projects for the authenticated user.

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "project-1",
      "name": "Website Redesign",
      "description": "Complete website redesign",
      "clientId": "client-1",
      "adminId": "admin-1",
      "status": "active",
      "startDate": "2026-03-15T00:00:00Z",
      "endDate": "2026-03-29T00:00:00Z",
      "roadmap": [...],
      "dailyProgress": [...]
    }
  ]
}
```

**Filters:**
- Admin: Returns all projects
- Client: Returns only projects assigned to them

---

### POST /api/projects

Create a new project (admin only).

**Headers:**
```
Authorization: Bearer eyJhbGc...
Content-Type: application/json
```

**Request:**
```json
{
  "clientId": "client-1",
  "name": "Mobile App",
  "description": "iOS and Android mobile app",
  "startDate": "2026-03-20",
  "endDate": "2026-04-03"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "project-2",
    "name": "Mobile App",
    "description": "iOS and Android mobile app",
    "clientId": "client-1",
    "adminId": "admin-1",
    "status": "planning",
    "startDate": "2026-03-20T00:00:00Z",
    "endDate": "2026-04-03T00:00:00Z",
    "roadmap": [],
    "dailyProgress": []
  }
}
```

**Errors:**
- 400: Missing required fields
- 403: Admin only
- 401: Unauthorized

---

### GET /api/projects/[projectId]

Get project details including roadmap.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "project-1",
    "name": "Website Redesign",
    "description": "Complete website redesign",
    "status": "active",
    "startDate": "2026-03-15T00:00:00Z",
    "endDate": "2026-03-29T00:00:00Z",
    "roadmap": [
      {
        "_id": "roadmap-1",
        "day": 1,
        "title": "Phase 1 - Day 1",
        "description": "Initial setup and planning",
        "videoUrl": "https://example.com/video-1.mp4",
        "completed": true,
        "feedback": "Looking good!",
        "approvedAt": "2026-03-15T10:00:00Z"
      }
    ]
  }
}
```

---

### PUT /api/projects/[projectId]

Update project details (admin only).

**Request:**
```json
{
  "status": "completed",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated project ... }
}
```

---

## Chat

### GET /api/chats

Get all messages across user's projects.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg-1",
      "projectId": "project-1",
      "senderId": "admin-1",
      "senderName": "Admin User",
      "senderRole": "admin",
      "message": "Great progress on the project!",
      "type": "text",
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/chats

Send a new message.

**Request:**
```json
{
  "message": "Here's my feedback on the design",
  "projectId": "project-1",
  "type": "text"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "msg-2",
    "projectId": "project-1",
    "senderId": "client-1",
    "senderName": "Client User",
    "senderRole": "client",
    "message": "Here's my feedback on the design",
    "type": "text",
    "createdAt": "2026-03-15T10:35:00Z"
  }
}
```

**Message Types:**
- `text` - Regular text message
- `voice` - Voice note/audio
- `video` - Video message
- `file` - File attachment

---

## Payments

### GET /api/payments

Get all payments for user's projects.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment-1",
      "projectId": "project-1",
      "amount": 5000,
      "currency": "USD",
      "status": "paid",
      "paymentMethod": "credit_card",
      "notes": "Initial deposit",
      "dueDate": "2026-03-10T00:00:00Z",
      "paidDate": "2026-03-08T00:00:00Z",
      "createdAt": "2026-03-05T00:00:00Z"
    }
  ]
}
```

**Status Values:**
- `pending` - Payment awaiting
- `paid` - Payment completed
- `overdue` - Payment past due date

---

## Setup Items

### GET /api/setup-items

Get all setup items for user's projects.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "setup-1",
      "projectId": "project-1",
      "itemNumber": 1,
      "title": "Brand Guidelines",
      "value": "Brand style guide provided",
      "completed": true,
      "completedAt": "2026-03-15T14:00:00Z"
    }
  ]
}
```

---

### PUT /api/setup-items/[itemId]

Mark setup item as complete/incomplete.

**Request:**
```json
{
  "completed": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "setup-1",
    "projectId": "project-1",
    "itemNumber": 1,
    "title": "Brand Guidelines",
    "completed": true,
    "completedAt": "2026-03-15T14:00:00Z"
  }
}
```

---

## Admin Only

### GET /api/admin/clients

Get all client users (admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "client-1",
      "email": "client@example.com",
      "name": "Client User",
      "role": "client",
      "company": "Client Corp",
      "phone": "+1-555-0101"
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes

- `200` - OK: Request succeeded
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid parameters or validation failed
- `401` - Unauthorized: Missing or invalid token
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `500` - Internal Server Error: Server-side error

---

## Authentication Headers

All endpoints except `/api/auth/*` require:

```
Authorization: Bearer <jwt_token>
```

Token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Tokens expire after 24 hours. Client must re-authenticate to get new token.

---

## Rate Limiting

Currently not enforced in development, but production setup includes:

- 100 requests per 15 minutes per IP
- Stricter limits on auth endpoints
- Implement via middleware if needed

---

## CORS Configuration

Currently allows requests from:
- `http://localhost:3000` (development)
- Update `CORS_ORIGINS` env variable for other domains

---

## Testing Endpoints

### Using cURL

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "confirmPassword": "Test1234",
    "name": "Test User",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Get Projects (requires token)
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import this collection: [Add to Postman collection link]
2. Set `base_url` variable to `http://localhost:3000`
3. Login to get token
4. Token automatically added to other requests

---

## WebSocket Support (Coming Soon)

Real-time chat will use WebSocket:

```javascript
const socket = io('http://localhost:3000');
socket.on('message', (data) => {
  console.log('New message:', data);
});
```

---

**API Ready for Production!** All endpoints follow REST conventions and include proper error handling.

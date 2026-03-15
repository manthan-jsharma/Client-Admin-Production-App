# Quick Start Guide

Get the Project Management Platform running in minutes!

## 5-Minute Setup

### 1. Start the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Run development server
pnpm dev
```

The app will start at `http://localhost:3000`

### 2. Auto-Redirect to Login

The home page automatically redirects to login if you're not authenticated.

### 3. Login with Demo Credentials

**Option A: Login as Client**
- Email: `client@example.com`
- Password: `Test1234`

**Option B: Login as Admin**
- Email: `admin@example.com`
- Password: `Test1234`

### 4. Explore the App

Based on your role, you'll see different dashboards and features.

---

## Features to Explore

### For Clients

1. **Dashboard** (`/dashboard/client`)
   - See your projects overview
   - Quick stats and recent updates

2. **Projects** (`/dashboard/client/projects`)
   - View all assigned projects
   - Click to see project details

3. **Roadmap** (`/dashboard/client/roadmap`)
   - Visual 14-day timeline
   - Track daily progress
   - Watch video updates

4. **Setup** (`/dashboard/client/setup`)
   - Check off setup items
   - Ensure project readiness

5. **Payments** (`/dashboard/client/payments`)
   - Track payment status
   - View payment history

6. **Chat** (`/dashboard/client/chat`)
   - Message your admin
   - Real-time communication

### For Admins

1. **Dashboard** (`/dashboard/admin`)
   - High-level business metrics
   - Recent projects and clients
   - Activity feed

2. **Projects** (`/dashboard/admin/projects`)
   - Create new projects
   - Manage all projects
   - Assign to clients

3. **Clients** (`/dashboard/admin/clients`)
   - View all clients
   - Manage client information
   - View client details

4. **Requests** (`/dashboard/admin/requests`)
   - Review pending requests
   - Approve or reject
   - Track request history

5. **Analytics** (`/dashboard/admin/analytics`)
   - Revenue tracking
   - Project statistics
   - Performance metrics

---

## Creating a Test Project (Admin)

1. Go to **Projects** page
2. Click **+ New Project** button
3. Fill in:
   - Project Name: "Website Redesign"
   - Client ID: "client-1"
   - Description: "Complete website redesign"
   - Start Date: Today
   - End Date: 14 days from today
4. Click **Create Project**

The project will be assigned to the client with ID "client-1".

---

## Testing Key Features

### Test Authentication Flow

1. **Signup**: Go to `/signup` and create a new account
2. **Login**: Use your credentials to login
3. **Logout**: Click logout button in sidebar user profile
4. **Role Protection**: Try accessing admin pages as client (should redirect)

### Test Project Features

1. Create a project as admin
2. Login as client to see the project
3. Track progress in roadmap
4. Complete setup items
5. View payment status

### Test Chat

1. Login as client
2. Send a message in chat
3. Login as admin to see the message
4. Admin sends a reply
5. Switch back to client to see reply

### Test Payments

1. Go to payments page
2. View all payments for your projects
3. See payment status (paid/pending/overdue)
4. View payment history

---

## Understanding the Mock Database

The app uses an in-memory mock database that:

- Auto-initializes with sample data on first run
- Persists data during development session
- Resets when you stop and restart the server
- Can be replaced with MongoDB by updating `lib/db.ts`

**Sample Data Included:**
- 2 users (1 admin, 1 client)
- 1 project
- 5 setup items
- 1 payment
- Sample roadmap items

---

## Placeholder API Keys

The app currently uses placeholder values for external services:

| Service | File | How to Enable |
|---------|------|---|
| Email (Resend) | API routes | Replace `RESEND_API_KEY` in `.env` |
| AI (OpenAI) | `/api/ai/*` | Replace `OPENAI_API_KEY` in `.env` |
| Storage (AWS S3) | `/api/uploads/*` | Replace AWS credentials in `.env` |

See `.env.example` for all configuration options.

---

## Deployment Checklist

Before deploying to production:

- [ ] Replace all placeholder API keys
- [ ] Connect real database (MongoDB/PostgreSQL)
- [ ] Update `JWT_SECRET` to a strong random value
- [ ] Set `NEXT_PUBLIC_API_URL` to your production URL
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain
- [ ] Review authentication security
- [ ] Test all user flows
- [ ] Set up monitoring/logging
- [ ] Configure email templates

---

## Troubleshooting

### Can't login?
- Clear browser cookies and localStorage
- Check demo credentials are typed correctly
- Try creating a new account via signup

### Page shows loading spinner?
- Check browser console for errors
- Verify auth token in localStorage
- Try refreshing the page

### Features not working?
- Ensure you're using correct user role
- Check that related data exists (projects for payments, etc.)
- Look for errors in browser dev tools console

### Want to reset data?
- Stop the dev server (`Ctrl+C`)
- Start it again (`pnpm dev`)
- Fresh sample data will be loaded

---

## Next Steps

1. **Explore the codebase**: Check `lib/`, `app/`, and `components/` structure
2. **Customize styling**: Edit `app/globals.css` and Tailwind config
3. **Add your branding**: Update colors, logos, and company names
4. **Connect real APIs**: Replace placeholder keys with real ones
5. **Add database**: Connect MongoDB or your preferred database
6. **Deploy**: Push to GitHub and connect to Vercel

---

## Code Structure Quick Reference

| Location | Purpose |
|----------|---------|
| `lib/auth.ts` | JWT and password utilities |
| `lib/auth-context.tsx` | Authentication state management |
| `lib/db.ts` | Database operations |
| `lib/types.ts` | TypeScript definitions |
| `components/dashboard/sidebar.tsx` | Navigation sidebar |
| `app/(auth)/` | Login/signup pages |
| `app/(dashboard)/` | Protected dashboard pages |
| `app/api/` | Backend API routes |

---

## Common Tasks

### Add a new dashboard page
1. Create `app/(dashboard)/client/[feature]/page.tsx`
2. Import necessary components and hooks
3. Add to sidebar menu in `components/dashboard/sidebar.tsx`

### Add a new API endpoint
1. Create `app/api/[resource]/route.ts`
2. Implement GET/POST/PUT/DELETE handlers
3. Add token verification and auth checks
4. Return proper ApiResponse format

### Create a new component
1. Create file in `components/[feature]/Component.tsx`
2. Make it a client component if it uses hooks
3. Export and import where needed
4. Style with Tailwind CSS

---

**You're all set!** Start exploring the app and customize it for your needs.

For detailed documentation, see `README.md`.

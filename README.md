# Project Management Platform

A comprehensive B2B project management and client communication platform built with Next.js, TypeScript, and React.

## Features

### Core Features
- **Multi-role Authentication**: Admin and Client roles with JWT-based authentication
- **Project Management**: Create, manage, and track projects
- **14-Day Roadmap**: Visual timeline with video integration and progress tracking
- **Real-time Chat**: Direct messaging between clients and admins
- **Payment Tracking**: Monitor project payments and billing
- **Setup Checklist**: 5-item setup tracker for project initialization
- **Dashboard**: Role-specific dashboards with analytics and quick stats
- **Admin Controls**: Manage clients, projects, requests, and view analytics

### Authentication
- Email/password signup and login
- Role-based access control (RBAC)
- Secure JWT token management
- Protected routes by user role

### Client Features
- View assigned projects
- Track 14-day roadmap with video updates
- Access setup checklist
- View payment status
- Real-time chat with admin
- View project analytics

### Admin Features
- Create and manage projects
- Manage all clients
- Review and approve requests
- View business analytics
- Track project progress
- Revenue tracking

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI components
- **Authentication**: JWT with bcrypt hashing
- **Database**: Mock implementation (ready for MongoDB integration)
- **Real-time**: Socket.io ready (currently mock)
- **API**: RESTful Next.js API routes

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

**Admin Account:**
- Email: `admin@example.com`
- Password: `Test1234`

**Client Account:**
- Email: `client@example.com`
- Password: `Test1234`

## Project Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/
│   ├── admin/
│   │   ├── page.tsx (dashboard)
│   │   ├── projects/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── requests/page.tsx
│   │   └── analytics/page.tsx
│   └── client/
│       ├── page.tsx (dashboard)
│       ├── projects/page.tsx
│       ├── [projectId]/page.tsx
│       ├── roadmap/page.tsx
│       ├── setup/page.tsx
│       ├── payments/page.tsx
│       └── chat/page.tsx
├── api/
│   ├── auth/
│   │   ├── signup/route.ts
│   │   └── login/route.ts
│   ├── projects/
│   │   ├── route.ts
│   │   └── [projectId]/route.ts
│   ├── chats/route.ts
│   ├── payments/route.ts
│   ├── setup-items/route.ts
│   └── admin/
│       └── clients/route.ts
├── page.tsx (redirect)
└── layout.tsx

lib/
├── auth.ts (JWT utilities)
├── auth-context.tsx (React context)
├── db.ts (Mock database)
└── types.ts (TypeScript definitions)

components/
└── dashboard/
    └── sidebar.tsx
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project (admin only)
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project (admin only)

### Chat
- `GET /api/chats` - Get all messages
- `POST /api/chats` - Send message

### Payments
- `GET /api/payments` - List payments

### Setup Items
- `GET /api/setup-items` - List setup items
- `PUT /api/setup-items/[id]` - Update setup item

### Admin
- `GET /api/admin/clients` - List all clients

## Environment Variables

Currently using placeholder values. Replace with your actual credentials:

```env
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
DATABASE_URL=mongodb://localhost:27017/project-management
RESEND_API_KEY=re_placeholder
OPENAI_API_KEY=sk_placeholder
AWS_ACCESS_KEY_ID=placeholder
AWS_SECRET_ACCESS_KEY=placeholder
AWS_BUCKET_NAME=placeholder
```

## Database Schema

The application uses a mock in-memory database with the following collections:

- **Users**: Authentication and user profiles
- **Projects**: Project details and metadata
- **Roadmap Items**: 14-day project timeline
- **Setup Items**: Project setup checklist
- **Chat Messages**: Real-time messaging
- **Payments**: Payment tracking
- **Testimonials**: Client testimonials
- **Lead Gen Requests**: Feature requests

## Security Considerations

- Passwords are hashed with bcrypt (production-ready)
- JWT tokens expire after 24 hours
- Protected routes verify token on every request
- Role-based access control enforced on all endpoints
- Input validation on both client and server
- CORS configuration ready for deployment

## Customization Guide

### Adding Real Database Support

Replace the mock database in `lib/db.ts` with your MongoDB/PostgreSQL connection:

```typescript
// Replace mock functions with real database calls
export async function getUserByEmail(email: string) {
  return await db.users.findOne({ email });
}
```

### Integrating External APIs

Update the placeholder API keys:

1. **Email**: Replace Resend placeholder with real API key
2. **AI Support**: Replace OpenAI placeholder with real key
3. **File Storage**: Configure AWS S3 credentials
4. **Real-time Chat**: Setup Socket.io server

### Customizing Styles

Edit `app/globals.css` to update the design tokens and colors to match your brand.

## Deployment

### To Vercel

```bash
# Push to GitHub repository
git push origin main

# Connect repository to Vercel dashboard
# Vercel automatically deploys on push
```

### To Other Platforms

Ensure environment variables are set and run:

```bash
pnpm build
pnpm start
```

## Best Practices Implemented

- TypeScript strict mode enabled
- Proper error handling throughout
- Input validation on all endpoints
- Responsive design for all screen sizes
- Accessibility features (ARIA labels, semantic HTML)
- Clean code structure with separation of concerns
- Reusable components and utilities
- Production-ready authentication flow

## Future Enhancements

- Real MongoDB integration
- WebSocket support for real-time updates
- File upload with AWS S3
- Email notifications with Resend
- AI support agent with OpenAI
- Advanced analytics dashboards
- Export reports to PDF
- Mobile app (React Native)
- Dark/light theme toggle
- Multi-language support

## Troubleshooting

### Token Issues
- Clear localStorage and login again
- Check browser dev tools for token presence

### Database Errors
- Verify mock data is loading (should auto-initialize)
- Check console for database operation errors

### API Errors
- Check request format matches endpoint spec
- Verify authorization headers are present
- Review error messages in API response

## Support & Documentation

For detailed documentation on each feature, refer to:
- Authentication: See `lib/auth.ts` and `lib/auth-context.tsx`
- Database: See `lib/db.ts` for all operations
- Types: See `lib/types.ts` for data structures
- Components: See individual component files

## License

This project is built as a demonstration platform for comprehensive project management functionality.

---

**Ready to Deploy!** This platform includes all core features with production-ready code patterns. Replace placeholder API keys and database with your real integrations to go live.

# THEOROGRAM

> Ideas over people. Reason over reaction. Signal over noise.

A platform for structured theory publishing and intellectual debate. Users don't post casually - they publish theories backed by reasoning.

## Philosophy

- **Ideas First**: Theorogram prioritizes ideas over personality and clout
- **Structured Discourse**: Every submission is a theory with reasoning, not a casual post
- **Critical Thinking**: Three-layer moderation (AI + human) rewards signal over noise
- **Accountability**: Theories are immutable after publishing - no editing, no drafts

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth

**Backend:**
- Node.js + TypeScript
- Express
- PostgreSQL (Supabase)
- Gemini AI (moderation)

## Project Structure

```
theorogram/
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # UI components
│   │   ├── contexts/    # React contexts (Auth)
│   │   └── lib/         # API client, utilities
│   └── package.json
│
├── server/              # Node.js backend
│   ├── src/
│   │   ├── config/      # Supabase, Gemini setup
│   │   ├── controllers/ # API route handlers
│   │   ├── middleware/  # Auth, admin middleware
│   │   ├── services/    # Moderation service
│   │   ├── jobs/        # Background scanning  
│   │   └── routes/      # Route aggregation
│   └── package.json
│
├── database/
│   └── schema.sql       # PostgreSQL schema
│
└── package.json         # Monorepo root
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Gemini API key

### 2. Clone and Install

```bash
cd g:/Theorogram
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. In the SQL Editor, run the schema from `database/schema.sql`
3. Copy your project URL and keys

### 4. Set Up Firebase

1. Create a Firebase project
2. Enable Email/Password authentication
3. Get your Web App Config for the frontend
4. Generate a Service Account Key (JSON) for the backend
5. Save the JSON file as `server/service-account.json`

### 5. Set Up Environment Variables

**Backend** (`server/.env`):
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp
FRONTEND_URL=http://localhost:3000
FIREBASE_SERVICE_ACCOUNT_JSON=./service-account.json
```

**Frontend** (`client/.env.local`):
```bash
cp client/.env.local.example client/.env.local
```

Edit `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Add your Firebase Web Config keys here (NEXT_PUBLIC_FIREBASE_*)
```

### 5. Run Development Servers

**Option A: Run both together** (from root):
```bash
npm run dev
```

**Option B: Run separately**:

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev:client
```

The app should now be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### 6. Create Admin User

1. Sign up via the app
2. In Supabase, go to Table Editor → `users`
3. Find your user and update `role` to `'admin'`

## Core Features

### User System
- **Profile Badge**: System-issued credential (username, level, status)
- **Reputation Dashboard**: Metrics, theories, debate participation
- **NO social features**: No bio, no followers, no personalization

### Theory Publishing
- **Pre-publish moderation**: Gemini classifies content (SAFE/NSFW/UNSAFE)
- **Immutable**: No editing after publish
- **Structured**: Title, body, references

### Debate System
Three independent interactions per theory:
1. **Vote**: upvote OR downvote  
2. **Stance**: FOR OR AGAINST
3. **Comment**: Flat, text-only arguments

### Moderation (3 Layers)

1. **Pre-Publish AI Check**: Block unsafe, shadowban NSFW, publish safe
2. **Post-Publish Rescanning**: Background job rescans published theories every 6 hours
3. **Human Jury**: Admins can delete, ban/unban, override AI decisions

### Feed Modes
- **Latest**: Sorted by timestamp
- **Popular**: Sorted by interaction score (upvotes + downvotes + stances + comments)

## UI Philosophy

The UI is intentionally:
- **Dark**: Near-black background, minimal color
- **Quiet**: No flashy animations, subtle transitions
- **Serious**: System-like, authoritative
- **Typography-first**: Monospace primary font
- **Minimal**: No gradients, no illustrations

This is NOT:
- Twitter
- Reddit  
- A creator economy platform
- A personality-driven network

## API Endpoints

### Theories
- `POST /api/theories` - Submit theory (auth required)
- `GET /api/theories` - List theories (sort: latest/popular)
- `GET /api/theories/:id` - Get single theory

### Votes & Stances
- `POST /api/votes` - Upvote/downvote (auth required)
- `POST /api/stances` - Set FOR/AGAINST stance (auth required)

### Comments
- `POST /api/comments` - Add comment (auth required)
- `GET /api/comments/:theoryId` - List comments

### Users
- `GET /api/users/:username` - Get profile
- `GET /api/users/:username/theories` - Get user's theories

### Search
- `GET /api/search?q=query` - Search theories and users

### Admin (Jury)
- `DELETE /api/admin/theories/:id` - Delete theory
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/moderation-logs` - View AI moderation logs
- `GET /api/admin/audit-logs` - View admin action logs

## Development Notes

### Database Optimization
- **Materialized View**: `theory_stats` caches vote/stance/comment counts
- **Refresh**: Call `refresh_theory_stats()` after mutations
- **Full-text Search**: GIN index on `title || body`

### Moderation Strategy
- **Default to Safe**: If Gemini fails, allow publication (prevents blocking legitimate content)
- **Confidence Scores**: Logged for human review
- **Audit Trail**: All admin actions logged with reason

### Background Jobs
- **Rescan Job**: Runs every 6 hours via node-cron
- **Rate Limiting**: 500ms delay between Gemini calls
- **Batch Processing**: 100 theories per run

## Production Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build:client`
2. Set environment variables
3. Deploy `client/` directory

### Backend (Railway/Render/Fly.io)
1. Build: `npm run build:server`
2. Set environment variables
3. Run: `npm run start --workspace=server`

### Database
- Use Supabase managed Postgres (recommended)
- Enable connection pooling for production
- Set up automated backups

## License

MIT

---

**Remember**: Clarity > virality. Reason > reaction. Ideas > people.

# Abhi2.0

Local-first AI-powered Gmail client management system with Express, PostgreSQL, Redis, BullMQ, Socket.io, Next.js App Router, SWR, Zustand, and OpenAI Responses API.

## Quick Start

1. Copy env files and fill secrets.

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

2. Install and run local infrastructure.

```bash
npm install
docker compose up -d postgres redis
npm run migrate
```

3. Start the app.

```bash
npm run dev --workspace apps/backend
npm run worker --workspace apps/backend
npm run dev --workspace apps/frontend
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:4000`.

## Notes

- AI replies are generated as drafts for human approval.
- Scheduled follow-ups auto-send after a user explicitly schedules them.
- Gmail Pub/Sub watch support is present but optional for local development.

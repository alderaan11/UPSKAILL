# AI Pulse — Project Context

## What is this?
A real-time AI news aggregator webapp with 4 main features:
1. **News Feed** (`/`) — aggregates AI news from RSS feeds, NewsAPI, and Polymarket prediction markets
2. **Model Updates** (`/models`) — filtered view of model-specific news (releases, benchmarks, etc.)
3. **Daily Challenge** (`/challenge`) — chatbot powered by OpenRouter that gives AI problem-solving challenges and aggressively critiques your solutions
4. **Job Board** (`/jobs`) — AI/ML job listings from Welcome to the Jungle and Adzuna

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4
- **LLM**: OpenRouter API (OpenAI-compatible SDK)
- **Deployment**: Docker + GitHub Actions CI/CD

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # News Feed (home)
│   ├── models/page.tsx    # Model Updates
│   ├── challenge/page.tsx # Daily Challenge chatbot
│   ├── jobs/page.tsx      # Job Board
│   └── api/               # API routes
│       ├── news/route.ts  # Aggregates RSS + NewsAPI + Polymarket
│       ├── challenge/route.ts # OpenRouter streaming chat
│       └── jobs/route.ts  # WTTJ + Adzuna jobs
├── components/            # Reusable UI components
│   ├── Navbar.tsx
│   ├── NewsCard.tsx
│   ├── PolymarketCard.tsx
│   └── JobCard.tsx
└── lib/                   # Data fetching utilities
    ├── openrouter.ts      # OpenRouter client config
    ├── rss.ts             # RSS feed parser
    ├── newsapi.ts         # NewsAPI client
    ├── polymarket.ts      # Polymarket API client
    └── jobs.ts            # WTTJ + Adzuna clients
```

## Key Patterns
- All external API calls are in `src/lib/` — one file per source
- API routes in `src/app/api/` proxy external calls and aggregate data
- Pages are client components that fetch from internal API routes
- The chatbot uses Server-Sent Events (SSE) for streaming responses
- Use `Promise.allSettled` for resilient parallel fetching (if one source fails, others still work)

## Environment Variables (in .env.local)
- `OPENROUTER_API_KEY` — required for chatbot
- `NEWSAPI_KEY` — optional, for news articles
- `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` — optional, for job listings

## Commands
- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `docker compose up --build` — run in Docker

## Style Guidelines
- Dark theme (zinc-950 background, zinc-800 borders)
- Color coding: blue = news, purple = polymarket, green = jobs, cyan = RSS
- Cards use rounded-xl, border-zinc-800, hover effects
- Keep components small and focused

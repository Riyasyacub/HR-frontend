# Incubyte HR — Frontend

React single-page application for the Incubyte HR demo. It is built story by story
alongside the Rails API in the sibling `incubyte` repository.

## Requirements

- Node.js 24+
- The Rails API running at `http://localhost:3000`

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run typecheck  # TypeScript
npm run lint       # Oxlint
npm run build      # production build
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so the
frontend can call the versioned API without a separate CORS origin in development.

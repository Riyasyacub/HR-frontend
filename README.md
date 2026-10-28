# Incubyte HR — Frontend

React single-page application for the Incubyte HR demo. It is built story by story
alongside the Rails API in the sibling `incubyte` repository.

## Requirements

- Node.js 24+
- The Rails API running at `http://localhost:3000`

## UI

Components use shadcn/ui with Tailwind CSS. Both are set up with the first frontend
story slice; do not add another component library.

## Current stage

Built through S11c: sign-in and roles, employees and org chart, leave and employee imports, payroll,
reports with trend charts, and the NL-to-SQL assistant, in a shadcn sidebar layout. Later stories are
documented in the API repository's `docs/future-plans.md`.

## Running with Docker

The API repository's `docker-compose.yml` runs this app's Vite dev server (port 5173) together with the
API, worker, database and Mailhog; see that repository's README. Inside Compose the dev server proxies
`/api` to `VITE_API_PROXY_TARGET` (`http://web:3000`); locally it defaults to `http://localhost:3000`.

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

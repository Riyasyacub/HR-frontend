# AGENTS.md

This repository is the React frontend for the Incubyte HR demo. It follows the project
rules in [`../incubyte/AGENTS.md`](../incubyte/AGENTS.md); read that file first.

## Frontend specifics

| Item | Value |
|---|---|
| Stack | React 19 + TypeScript + Vite 8 |
| Tests | Vitest + React Testing Library (`npm test`) |
| Lint / types | Oxlint (`npm run lint`), `npm run typecheck` |
| Dev server | `npm run dev` at `http://localhost:5173` |
| API proxy | `/api` → `http://localhost:3000` |

- Follow TDD: write a failing component test, then the component, then refactor.
- The 50-line production chunk limit includes changes under `src/`; test files are excluded.
- Log every prompt in `../incubyte/prompts/prompt-log.md`.
- A story is complete only when its backend and frontend slices are both delivered and tested.
- Commit once per accepted story in both repositories; never commit mid-story.
- Ask before adding dependencies or changing the API contract or UI approach.

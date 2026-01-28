# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router pages and API routes (e.g., `app/experiment/page.tsx`, `app/api/export/`).
- `components/` holds UI pieces, grouped by feature (`components/experiment/`, `components/survey/`).
- `lib/` provides shared logic (tracking, ticket scoring, knowledge base parsing).
- `data/` stores source data (`tickets.json`, `knowledge/`) and runtime output in `data/collected/` (gitignored).
- `types/` centralizes TypeScript types.

## Build, Test, and Development Commands
- `npm run dev` starts the local server (default `http://localhost:3000`).
- `npm run build` produces a production build.
- `npm start` runs the production build locally.
- `npm run lint` runs Next.js ESLint checks.
- `npx tsc --noEmit` performs a TypeScript type check.

## Coding Style & Naming Conventions
- TypeScript + React with Next.js 14 App Router; keep logic in `lib/` and presentation in `components/`.
- Use 2-space indentation in TS/TSX (default for Next.js/ESLint).
- File naming: React components are `PascalCase.tsx` (e.g., `TicketDetail.tsx`), utilities are `camelCase.ts` (e.g., `tracking.ts`).
- Styling is Tailwind CSS; prefer utility classes over custom CSS.

## Testing Guidelines
- No automated test framework is configured in this repo.
- Validate changes via the manual flow: launch `npm run dev`, open a URL with required params (e.g., `?group=1&participantId=TEST123`), and complete the experiment → survey → completion.

## Commit & Pull Request Guidelines
- Recent commit messages are short, imperative, and unprefixed (e.g., “Bugfix”, “Remove query params and improve tracking”).
- Keep commits focused on one change set; include the testing or validation you ran in the PR description.
- PRs should describe the experimental group(s) tested and include screenshots for UI changes.

## Configuration & Data Handling
- Runtime configuration lives in `.env.local` (e.g., `OPENAI_API_KEY`, `ADMIN_KEY`, optional PostHog keys).
- Ensure `data/collected/` exists before running locally: `mkdir -p data/collected`.
- Do not commit collected participant data or secrets.

## Agent-Specific Notes
- Access links must include `group` and `participantId` query parameters; missing params intentionally show “Invalid access link”.

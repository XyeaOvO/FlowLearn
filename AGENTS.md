# Repository Guidelines

## Project Structure & Module Organization
- Renderer app in `src/` (React + TypeScript). Feature modules in `src/features/{vocab,settings,review}`; shared UI, hooks, and contexts in `src/shared/`; styles in `src/styles/`; entry `src/main.tsx`.
- Electron process in `electron/` (`main.ts`, `preload.ts`). Shared types live in `shared/`. Public assets in `public/` (e.g., `icon.png`).
- Path aliases: `@features/*`, `@lib/*`, `@shared/*`, `@/*` (see `tsconfig.json` and `vite.config.ts`). Prefer aliases over deep relative paths.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server for the renderer.
- `npm run electron:dev` — start Electron; run alongside `npm run dev` for full desktop dev.
- `npm run build` — type-check then build renderer and Electron bundles.
- `npm run preview` — preview built renderer in the browser (not Electron).
- `npm run electron:pack` — package the desktop app with electron-builder.
- `npm run lint` / `npm run lint:fix` — run ESLint and auto-fix issues.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict` mode enabled). React with JSX.
- Indentation: 2 spaces; keep lines reasonably short (~100–120 chars).
- Naming: components `PascalCase.tsx`, hooks `useSomething.ts`, other files/functions camelCase; constants UPPER_SNAKE_CASE.
- Organize by feature (`src/features/*`) and reuse via `src/shared/*`. Run `npm run lint` before committing.

## Testing Guidelines
- Tests not yet configured. If adding, use Vitest + React Testing Library.
- Place tests next to sources: `Component.test.tsx`, `lib/util.test.ts`.
- Target helpers, hooks, and critical flows first; include basic accessibility checks for UI.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `type(scope): subject` (e.g., `feat(vocab): add bulk import`, `fix(db): handle migration failure`).
- PRs should include: concise description, linked issues (`Fixes #123`), screenshots/GIFs for UI changes, and testing notes.
- Keep changes focused and incremental; avoid unrelated refactors in the same PR.

## Security & Configuration Tips
- Keep `nodeIntegration` disabled; use `preload` + IPC (`src/lib/ipc.ts`). Sanitize any HTML with `dompurify`.
- After adding native dependencies, run `npx electron-rebuild`. Review `electron-builder` config before packaging.


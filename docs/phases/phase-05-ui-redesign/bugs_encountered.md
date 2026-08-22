# Phase 5: Bugs Encountered & Mitigations

## Bug 1: React 19 / Bun Dependencies in Reference UI
* **Symptom**: The reference `package.json` specified React 19, `@tanstack/react-start`, and Bun-specific build hooks, which are incompatible with Next.js 14 App Router.
* **Root Cause**: The reference project was built with TanStack Start rather than Next.js.
* **Mitigation**: Selected and installed only the universal UI utility packages (`clsx`, `tailwind-merge`, `class-variance-authority`, `framer-motion`) and ported the pure CSS tokens into Next.js 14 `src/app/globals.css`.

## Bug 2: Missing Image Assets in Reference Code
* **Symptom**: `hero-visual.jpg` was referenced in the reference codebase.
* **Root Cause**: Next.js App Router requires static assets to reside in the `public/` directory to be served via `/assets/hero-visual.jpg`.
* **Mitigation**: Extracted `hero-visual.jpg` from the reference archive directly into `public/assets/hero-visual.jpg`.

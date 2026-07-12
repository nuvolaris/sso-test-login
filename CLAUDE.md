# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leonardo PSN SSO Test Login is a React frontend. The frontend uses Vite, TypeScript, TailwindCSS, and shadcn/ui components.

## Commands

Never start a development enviroment.

Always assume there is a continuous deployment enviroment running.

## Architecture

**Frontend Stack:**

- React 18 with TypeScript
- Vite build tool
- React Router v6 (HashRouter for serverless compatibility)
- React Query for server state
- shadcn/ui components (Radix UI + Tailwind)
- Sonner for toast notifications

**Project Structure:**

```
src/
├── components/ui/  # shadcn/ui wrapped components
├── pages/          # Page components (routed in App.tsx)
├── hooks/          # Custom React hooks
├── lib/utils.ts    # Utility functions (cn() for classnames)
├── App.tsx         # Root component with providers and routing
└── main.tsx        # Entry point
```

## Conventions

- Use `@/` path alias for imports from `src/`
- Add new routes in [App.tsx](src/App.tsx) above the catch-all `*` route
- TypeScript is configured with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- Styling uses TailwindCSS with CSS variables for theming (defined in `index.css`)

# LumaHealth

**Care, connected.**

A self-contained patient, clinician, and admin care-management platform. Warm mineral surfaces, editorial typography, and real workflows — not a hospital-dashboard template.

All records are fictional.

## Run

```bash
cd lumahealth
npm install
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- API: [http://127.0.0.1:4000](http://127.0.0.1:4000)

Production-style (API serves the built client):

```bash
npm run build
npm start
```

## Demo accounts

Password for every demo account: `luma-demo`

| Role | Email |
| --- | --- |
| Patient | david@luma.health |
| Clinician | amara@luma.health |
| Admin | admin@luma.health |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite client + Express API |
| `npm run build` | Typecheck, Vite build, compile server |
| `npm start` | Serve compiled API + static client |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (app + server) |
| `npm test` | Vitest (client + API) |

## Stack

React 19, TypeScript, Vite, React Router 7, TanStack Query, Express 5, Zod, Vitest, React Testing Library, Supertest, Tailwind CSS, Manrope + DM Serif Display.

## Layout

```
lumahealth/
  src/                 React app (design system, portals, pages)
  server/              Express API, seed data, services
  shared/              Types, Zod schemas, constants
  public/              Favicon
```

See the end-of-build report in the project conversation for architecture, RBAC, models, and coverage notes.

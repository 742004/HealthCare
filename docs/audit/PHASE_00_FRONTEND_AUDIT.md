# Frontend Audit

- **Framework:** React + TypeScript + Vite.
- **Routing:** TanStack Router (`__root.tsx`, `router.tsx`).
- **UI Component Library:** Shadcn UI (`components/ui/`), Tailwind CSS.
- **State:** Scaffolding exists (`dashboard.*.tsx` files).
- **API Client:** `services/api.ts` skeleton.
- **Tests:** NONE (no Vitest/RTL setup found).

**Conclusion:** The frontend is a scaffolded shell. It has pages and routing for Patient, Doctor, Driver, and Hospital dashboards, but lacks connected business logic, error boundary handling, and testing.

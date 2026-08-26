# Repository Inventory

## Directories
- `backend/`
  - `src/` (app.js, server.js)
    - `config/`
    - `controllers/`
    - `core/`
    - `docs/`
    - `middleware/`
    - `models/`
    - `prompts/`
    - `providers/`
    - `realtime/`
    - `routes/`
    - `services/`
    - `utils/`
    - `validations/`
- `frontend/`
  - `public/`
  - `src/`
    - `assets/`, `components/`, `config/`, `context/`, `hooks/`, `lib/`, `routes/`, `services/`

## Configuration Files
- `backend/package.json` (Express, Mongoose, Socket.io, Firebase-admin, Zod, etc.)
- `frontend/package.json` (Vite, React, Tailwind, TanStack Router)
- `frontend/vite.config.ts`, `frontend/tsconfig.json`
- `.gitignore`
- `backend/.env.example`

## Testing Status
- No `.test.js` or `tests/` directories found in backend.
- No test files found in frontend.

## CI/CD Status
- No `.github/workflows` directory exists.

## Frontend Status
- Scaffolding exists (React, Vite, TanStack Router, Shadcn).
- Empty/No real implementation logic tested yet.

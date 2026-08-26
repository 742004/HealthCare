# API Matrix

| Route | Controller | Service | Authentication | Roles | Validation | Database Interaction | Status | Gaps |
|-------|------------|---------|----------------|-------|------------|----------------------|--------|------|
| `/api/v1/auth/register` | `auth.controller.js` | `auth.service.js` | No | Any | Zod | Direct via Model | REAL | No Repository Layer |
| `/api/v1/auth/login` | `auth.controller.js` | `auth.service.js` | No | Any | Zod | Direct via Model | REAL | No Repository Layer |
| `/api/v1/emergency/*` | `emergency.controller.js` | `emergency.service.js` | Yes | Patient | None | PLACEHOLDER | PARTIAL | Missing Repo, Placeholders |
| `/api/v1/ai/*` | `ai.controller.js` | `ai.service.js` | Yes | Mixed | Zod | Direct via Model | REAL | External AI is mocked |
| `/api/v1/maps/*` | `maps.controller.js` | `maps.service.js` | Yes | Driver/Pt | None | N/A | PLACEHOLDER| Returns empty arrays |
| `/api/v1/hospital/*` | `hospital.controller.js` | `hospital.service.js` | Yes | Admin/Hosp | None | Direct via Model | PARTIAL | No Repository Layer |

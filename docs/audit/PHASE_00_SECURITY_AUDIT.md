# Authentication/Security Audit

- **Authentication Flow:** JWT-based, currently implemented in `auth.service.js`. 
- **Refresh Tokens:** Not explicitly separated/rotated.
- **Password Hashing:** Implemented (`bcrypt`).
- **RBAC:** Present (`authorize` middleware exists).
- **Ownership Checks:** Basic checks exist, but BOLA/IDOR risks remain in unvalidated routes.
- **Validation:** Zod schemas exist for `auth` and `ai`, but missing for `emergency`, `hospital`, etc.
- **Rate Limiting:** Global rate limiters exist, but lack endpoint-specific granularity.
- **CORS:** Configured with `helmet` and `cors`.
- **Secret Handling:** JWT blacklisting is a mock in `token.service.js`.

**Conclusion:** Base security middleware is present, but critical gaps exist in Socket.IO auth (which is mocked) and JWT revocation.

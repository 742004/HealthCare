# External Integration Audit

| Provider | SDK/Package | Env Var | Real? | Stub? | Error Handling | Retry | Tests? | Status |
|----------|-------------|---------|-------|-------|----------------|-------|--------|--------|
| MongoDB | `mongoose` | `MONGO_URI` | YES | NO | Basic | NO | NO | Active but lacks repos |
| Groq/Gemini | `@google/generative-ai` | Various | PARTIAL| YES | Minimal | NO | NO | Provider exists, emergency flow uses mock |
| Google Maps| N/A | None | NO | YES | N/A | NO | NO | Completely stubbed in emergency flow |
| Firebase | `firebase-admin`| `FIREBASE_*`| PARTIAL| YES | Minimal | NO | NO | Provider exists, emergency flow uses mock |
| Socket.IO | `socket.io` | N/A | PARTIAL| YES | NO | NO | NO | Auth is mocked, state tracking weak |
| Email | `nodemailer` | SMTP vars | PARTIAL| YES | Basic | NO | NO | Hardcoded mock emails |

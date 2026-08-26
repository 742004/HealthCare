# Risk Register

| Risk | Level | Impact | Description |
|------|-------|--------|-------------|
| **Missing Repository Layer** | CRITICAL | Architecture | Services couple directly to DB models, making testing and transaction management fragile. |
| **Emergency Stubbing** | CRITICAL | Functionality | Core SOS flow is hardcoded to return `null` and mock data, rendering the app unusable. |
| **No Automated Tests** | CRITICAL | Stability | Zero test coverage means any change can break the system silently. |
| **Socket Mock Auth** | CRITICAL | Security | Real-time connections are not authenticated, allowing complete data exposure. |
| **Network Calls in Transactions** | HIGH | Resilience | Calling AI/Maps inside a DB transaction will cause lock-ups and timeouts. |
| **No CI/CD** | HIGH | Quality | No automated quality gates exist for PRs. |
| **Token Blacklist Mock** | HIGH | Security | JWT revocation is a mock, meaning logged-out tokens remain valid. |
| **Missing Request Validation** | MEDIUM | Security | Many routes (like Emergency, Ambulance) lack Zod validation schemas. |

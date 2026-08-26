# Placeholder/Stub/Mock Matrix

| File | Function | Type | Prod Path? | Impact | Priority |
|------|----------|------|------------|--------|----------|
| `emergency.service.js` | `EmergencyRepository.*` | Mock/Null | YES | Prevents emergency creation | CRITICAL |
| `emergency.service.js` | `mapsService.findNearbyHospitals` | Mock/Null | YES | No routing/matching | CRITICAL |
| `emergency.service.js` | `aiService.analyzeTriage` | Mock | YES | Fake AI severity | HIGH |
| `emergency.service.js` | `notificationService.*` | Stub | YES | Notifications silently drop | HIGH |
| `emergency.service.js` | `firebaseService.publishRealtimeUpdate` | Stub | YES | No live UI updates | HIGH |
| `token.service.js` | `blacklist` checks | Mock | YES | Tokens aren't really revoked | HIGH |
| `chat.service.js` | `_encryptMessage` | Mock | YES | Chats are not securely encrypted | HIGH |
| `medicalRecord.service.js` | `generatePDF` | Mock | YES | Returns hardcoded Buffer | MEDIUM |
| `socket.gateway.js` | Authentication | Mock | YES | Anyone connects as 'mock-user' | CRITICAL |

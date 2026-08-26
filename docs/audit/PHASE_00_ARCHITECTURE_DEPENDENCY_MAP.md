# Architecture Dependency Map

## Control Flow
Routes -> Controllers -> Services -> **Models (Direct Access)**

**Architectural Violation:** Services access Mongoose Models directly. The Repository layer is completely missing.

## External Systems Flow
`emergency.service.js` -> `mapsService` (MOCKED)
`emergency.service.js` -> `aiService` (MOCKED)
`emergency.service.js` -> `firebaseService` (MOCKED)

**Architectural Violation:** Network calls (even mocked ones) are mixed directly inside MongoDB transaction scopes in `emergency.service.js`.

## Real-Time Flow
Socket Gateway -> Mock Authentication -> Direct Event Emission
**Architectural Violation:** Sockets assign a hardcoded `mock-user-id` to every connection.

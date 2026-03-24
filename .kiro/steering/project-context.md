---
inclusion: always
---

# UW Flow — Project Context

## What This Is
UW Flow is a real-time campus movement and comfort assistant for University of Washington students. It helps Huskies find dry walking routes, check venue wait times, and locate quiet study spots.

## Architecture
The app runs as a single Express server (`demo-server.js`) serving a static frontend (`demo.html`). No build step, no database — everything is in-memory for instant startup.

The original microservices design (5 TypeScript services, PostgreSQL+PostGIS, Redis) is documented in `.kiro/specs/uw-flow/design.md` and implemented as scaffolding in `packages/`.

## Key Algorithms
- **Dijkstra's algorithm** for driest/fastest route computation over a campus path graph
- **Keyword extraction + fuzzy matching** for Ask Flow chatbot responses
- **Rolling time-window aggregation** for wait time estimates

## UW Branding
- Primary purple: `#4b2e83`
- Gold accent: `#b7a57a`
- Cherry blossom SVG in the banner
- Tab names: "Stay Dry", "Wait Times", "Busy Huskies"

## Running the App
```bash
npm install express
node demo-server.js
# Open http://localhost:3000
```

## Spec Files
- `.kiro/specs/uw-flow/requirements.md` — 7 requirements with acceptance criteria
- `.kiro/specs/uw-flow/design.md` — Full architecture, data models, API contracts, 22 correctness properties
- `.kiro/specs/uw-flow/tasks.md` — 15 implementation tasks with sub-tasks

# UW FLOW 🌦️🌸

**Real-Time Campus Movement & Comfort Assistant for University of Washington Students**

> Built with [Kiro](https://kiro.dev) — spec-driven development, agent hooks, and steering docs.

---

## Problem Statement

UW's campus is massive, rainy, and crowded. Students waste time walking through downpours when covered routes exist, wait in long lines at dining halls without knowing alternatives, and struggle to find quiet study spots during peak hours. There's no unified tool that helps Huskies navigate campus intelligently based on real-time conditions.

## Target Users

- UW students navigating between classes in the rain
- Students looking for quiet study spaces or short food lines
- Anyone on campus who wants to move smarter, not harder

## Solution Summary

UW Flow is a single-page web app with three core features:

| Tab | What it does |
|-----|-------------|
| **Stay Dry** | Finds the driest walking route between buildings using Dijkstra's algorithm, visualized on a Leaflet map with purple/gold paths. Huskies can upvote the best routes. |
| **Wait Times** | Shows real-time wait estimates for 11 campus venues (dining, gym, library, health) with predictions, check-ins, and category filters. |
| **Busy Huskies** | Displays study spot density across 14 campus buildings with filter chips (Libraries, Buildings, Outdoor, Quiet Only) and density bars. |

All three tabs include **Ask Flow**, an interactive campus assistant that answers natural language questions like "how busy is Suzzallo?" using live data.

## Key Features

- Driest vs fastest route comparison with interactive Leaflet map
- Community upvoting on routes ("12 Huskies recommend this")
- Venue wait time predictions (+10m, +20m, +30m forecasts)
- Crowd-sourced check-ins to keep data fresh
- Smart filter chips and search across all tabs
- Ask Flow chatbot powered by server-side NLP matching
- Cherry blossom SVG banner (because UW + cherry blossoms)
- Fully responsive, no build step required

---

## Setup Instructions

```bash
# 1. Install the only dependency
npm install express

# 2. Start the server
node demo-server.js

# 3. Open in your browser
# http://localhost:3000
```

That's it. No build step, no TypeScript compilation, no database. One dependency, one command.

---

## Architecture Decisions

### Why a standalone Express server?

We started with a full microservices architecture (5 TypeScript services, PostgreSQL+PostGIS, Redis, WebSocket layer) — you can see the original design in `.kiro/specs/uw-flow/design.md`. For the hackathon demo, we consolidated everything into a single `demo-server.js` file to eliminate infrastructure complexity and make the app instantly runnable.

### Tech choices

| Choice | Why |
|--------|-----|
| **Plain JS + Express** | Zero build step, instant startup, easy to demo |
| **Leaflet.js (CDN)** | Free, open-source maps with no API key required |
| **In-memory data** | No database setup — 20 buildings, 11 venues, path graph all live in memory |
| **Dijkstra's algorithm** | Classic shortest-path adapted for "driest" routing by weighting edges on rain exposure |
| **Server-side NLP matching** | Ask Flow chat uses keyword extraction and fuzzy matching against live venue/building data |

### Trade-offs

- **No persistence**: Data resets on server restart. Fine for a demo; production would use PostgreSQL+PostGIS.
- **Simulated data**: Wait times and crowd density use randomized values with realistic distributions rather than real sensor data.
- **Single process**: Everything runs in one Node.js process. The microservices design in the spec shows how this would scale.

### Security and Scalability (production path)

- JWT auth via API Gateway (designed in spec, not needed for demo)
- Rate limiting on check-in and vote endpoints
- Redis caching layer for route computations and wait time aggregations
- WebSocket for real-time heatmap updates instead of polling
- PostGIS for proper geospatial queries at scale

---

## Kiro Usage — Spec-Driven Development

This project was built entirely using [Kiro's](https://kiro.dev) spec-driven development workflow. The `.kiro/specs/uw-flow/` directory contains the full spec that guided implementation:

### The Workflow

1. **Requirements** (`requirements.md`) — Started with a rough idea ("campus app for UW students") and iteratively refined it into 7 formal requirements with acceptance criteria covering dry-route navigation, wait times, crowd heatmaps, smart routing, alerts, check-ins, and the Ask Flow assistant.

2. **Design** (`design.md`) — Kiro generated a full technical design from the requirements: microservices architecture diagram (Mermaid), data models, API contracts, algorithm pseudocode for Dijkstra's dry-route engine, and component interaction flows.

3. **Tasks** (`tasks.md`) — The design was broken into 15 implementation tasks with sub-tasks, each mapped back to specific requirements. Kiro executed these tasks sequentially, building out the monorepo package by package.

### How Kiro Helped

- **Spec iteration**: Requirements and design went through multiple review cycles before any code was written. This caught design issues early (e.g., the coverage score calculation, graceful degradation strategy).
- **Task execution**: Each task was implemented by Kiro with full context of the spec, so the code stayed aligned with the design.
- **Pivot support**: When we pivoted from microservices to a standalone demo server, Kiro adapted the implementation while preserving the core algorithms and data models from the original spec.
- **UI iteration**: Multiple rounds of UI refinement (tab renaming, layout changes, filter chips, map integration, cherry blossoms) were handled conversationally with Kiro making changes and verifying them.

### Agent Hooks

Three hooks automate quality checks during development:

- **Spec Alignment Check** (`preTaskExecution`) — Before each spec task starts, the agent reviews the task against `requirements.md` and `design.md` to ensure implementation stays aligned with the spec. This caught potential deviations early, especially during the microservices-to-demo pivot.
- **Validate Demo Server** (`fileEdited` → `demo-server.js`) — Runs `node --check demo-server.js` on every save to catch syntax errors instantly. Since the entire backend lives in one file, a single typo could break everything — this hook prevented that.
- **UW Branding Review** (`fileEdited` → `demo.html`) — When the frontend is edited, the agent reviews changes to verify UW branding consistency (purple `#4b2e83`, gold `#b7a57a`, cherry blossom theming). This was essential during the many rounds of UI iteration.

### Steering Files

Two steering documents provide persistent context to the agent across all interactions:

- **`project-context.md`** (always included) — Gives the agent full project context: architecture, key algorithms, UW branding colors, how to run the app, and where the spec files live. This meant the agent never lost context between conversations.
- **`coding-standards.md`** (included when editing code files) — Enforces coding standards: UW color palette usage, semantic HTML, API design patterns, error handling conventions. Automatically activates when any `.js`, `.ts`, `.tsx`, or `.html` file is in context.

### What's in `.kiro/`

```
.kiro/
├── hooks/
│   ├── spec-alignment-check.kiro.hook   # Pre-task spec review
│   ├── validate-demo-server.kiro.hook   # Syntax check on save
│   └── uw-branding-review.kiro.hook     # Branding consistency check
├── steering/
│   ├── project-context.md               # Always-on project context
│   └── coding-standards.md              # Code standards (auto for code files)
└── specs/uw-flow/
    ├── requirements.md                  # 7 requirements with acceptance criteria
    ├── design.md                        # Full architecture, data models, API contracts
    └── tasks.md                         # 15 implementation tasks with sub-tasks
```

---

## Learning Journey

### Challenges

- **Scope management**: The original microservices design was ambitious for a hackathon. Pivoting to a single-file demo server was the right call — it preserved the algorithms while making the app instantly runnable.
- **Map integration**: Getting Leaflet to render campus paths correctly required careful coordinate mapping of 20+ UW buildings and a bidirectional path graph.
- **Ask Flow NLP**: Building a useful chatbot without an LLM meant designing smart keyword extraction and fuzzy matching against live data. It handles questions like "how busy is Suzzallo?" and "where should I eat?" surprisingly well.

### What We Learned

- Spec-driven development with Kiro kept us from building the wrong thing. Having requirements and design locked down before coding meant fewer rewrites.
- A single-file architecture can be surprisingly powerful for demos. Our `demo-server.js` packs Dijkstra's algorithm, venue tracking, crowd density, route voting, and NLP chat into one file.
- UW students really do need this — the rain routing alone would save a lot of soggy walks across Red Square.

### Forward Thinking

- **Real weather data**: Integrate OpenWeatherMap or UW's own weather station API for live rain forecasts
- **Mobile app**: The original React Native design is ready to build from the spec
- **Real-time updates**: WebSocket-powered heatmaps that update as students check in
- **Indoor routing**: Add building floor plans for indoor navigation between classes
- **Accessibility**: Screen reader support, high-contrast mode, voice-guided navigation
- **ML predictions**: Train wait time models on historical check-in data instead of simple averaging

---

## Demo Video

*[Demo video link will be added here]*

<!-- Record a 3-minute video showing:
1. Stay Dry: Select two buildings, see driest vs fastest routes on the map, upvote a route
2. Wait Times: Browse venues, use filters, check in, ask Ask Flow a question
3. Busy Huskies: Filter study spots, check density bars, chat with Ask Flow
-->

---

## Team

Built for the Kiro hackathon by a solo developer + Kiro as the AI pair programmer.

## License

MIT
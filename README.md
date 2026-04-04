# UW FLOW 🌦️🌸
# Contributor: Sakshi Verma
# Winner of AWS Reachback Building for Impact Hackathon: Most Innovative Use of Kiro

**How I Built a Campus Movement App for UW Using Kiro**

> Built with [Kiro](https://kiro.dev) — spec-driven development, agent hooks, and steering docs.

---

## The Problem

If you've walked across UW's campus in the rain, you know the feeling. Soaked pants, wet socks, shoes squelching into your next lecture. The thing is — there are covered routes between most buildings. Tunnels, covered walkways, building cut-throughs. We just don't know about them.

And it's not just rain. You walk to Suzzallo to study and it's packed. You head to the HUB for food and the line is 20 minutes deep. There's no way to know before you get there.

UW has over 47,000 students. On any given day, thousands of us are making these blind decisions — getting wet, wasting time, turning around. UW Flow fixes that.

## What I Built

UW Flow is a real-time campus assistant with three tabs:

**Stay Dry** — Pick two buildings and get the driest walking route, visualized on a Leaflet map with purple and gold paths (UW colors, obviously). Routes are computed using Dijkstra's algorithm weighted by rain exposure. Multiple routes show up as separate bars sorted by community votes — if other Huskies found a good path, they upvote it.

**Wait Times** — Real-time wait estimates for 11 campus venues: dining halls, the gym, libraries, even Hall Health. Each venue card shows a density bar, predictions at +10/+20/+30 minutes, and a "Go Now" or "Go Later" recommendation. Filter by category — dining, library, gym, health, or just short waits.

**Busy Huskies** — Study spot density across 14 campus buildings. Filter by libraries, buildings, outdoor spots, or quiet-only. Each card shows how crowded a spot is with a visual density bar. Perfect for finals week when every seat matters.

All three tabs include **Ask Flow** — a chatbot on the right side that answers questions like "how busy is Suzzallo?" or "where should I eat?" using live data from the server.

The whole thing is crowd-sourced. Every check-in, every upvote, every interaction makes the data better for everyone. The more Huskies use it, the smarter it gets.

## How I Used Kiro

This project was built entirely using [Kiro's](https://kiro.dev) spec-driven development workflow. I didn't just use Kiro as a code assistant — I used it as a design partner from the very first idea.

### Spec-Driven Development

I started with a rough idea: "campus app for UW students." Kiro helped me turn that into:

1. **Requirements** — 7 formal requirements with acceptance criteria covering dry-route navigation, wait times, crowd heatmaps, smart routing, alerts, check-ins, and the Ask Flow assistant. We went through multiple review cycles before writing any code.

2. **Design** — A full technical design: microservices architecture diagram, data models, API contracts, algorithm pseudocode for Dijkstra's dry-route engine, 22 correctness properties, and component interaction flows.

3. **Tasks** — 15 implementation tasks with sub-tasks, each mapped back to specific requirements. Kiro executed these sequentially, building out the monorepo package by package.

The full spec lives in `.kiro/specs/uw-flow/` — requirements, design, and tasks are all there.

### Agent Hooks

I set up three hooks that automated quality checks during development:

- **Spec Alignment Check** — Before each spec task starts, the agent reviews the task against the requirements and design docs to make sure implementation stays on track. This was especially useful during the pivot from microservices to a single-file demo.
- **Validate Demo Server** — Runs `node --check demo-server.js` every time I save the backend. Since the entire server lives in one file, a single typo could break everything. This hook caught issues instantly.
- **UW Branding Review** — When I edit the frontend, the agent checks that UW branding is consistent — purple `#4b2e83`, gold `#b7a57a`, cherry blossom theming. Essential during the many rounds of UI iteration.

### Steering Files

Two steering documents give the agent persistent context:

- **`project-context.md`** (always active) — Full project context: architecture, algorithms, UW branding, how to run the app, where the spec files live. The agent never lost context between conversations.
- **`coding-standards.md`** (activates for code files) — Enforces coding standards: UW color palette, semantic HTML, API patterns, error handling. Automatically kicks in when any `.js`, `.ts`, `.tsx`, or `.html` file is in context.

### The Pivot

My biggest aha moment: the original design was a full microservices architecture — 5 TypeScript services, PostgreSQL+PostGIS, Redis, WebSocket layer. Ambitious, but too much infrastructure for a hackathon demo. Kiro helped me pivot to a single `demo-server.js` file while preserving the core algorithms and data models from the original spec. The microservices scaffolding is still in `packages/` — the spec shows how this would scale to production.

Spec-driven development isn't slower than just coding — it's faster because you never backtrack.

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

## Challenges

**Scope management** — The microservices design was the right architecture for production but wrong for a hackathon timeline. Recognizing that early and pivoting to a single-file demo server saved the project. The algorithms stayed the same; only the infrastructure changed.

**Map integration** — Getting Leaflet to render campus paths correctly meant hand-mapping coordinates for 20+ UW buildings and building a bidirectional path graph with weighted edges. Not glamorous work, but it makes the Stay Dry tab actually useful.

**Ask Flow without an LLM** — I wanted a chatbot that could answer "how busy is Suzzallo?" without calling an external AI API. The solution was server-side keyword extraction and fuzzy matching against live venue and building data. It handles natural language questions surprisingly well for a pattern matcher.

## What I Learned

- Spec-driven development with Kiro kept me from building the wrong thing. Having requirements and design locked down before coding meant fewer rewrites and zero "wait, what was this supposed to do?" moments.
- A single-file architecture can be surprisingly powerful for demos. `demo-server.js` packs Dijkstra's algorithm, venue tracking, crowd density, route voting, and NLP chat into one runnable file.
- UW students really do need this. The rain routing alone would save a lot of soggy walks across Red Square.

## What's Next

- **Real weather data** — Integrate OpenWeatherMap or UW's own weather station API for live rain forecasts instead of simulated data
- **Connect with UW locations** — Have campus venues update their information directly so UW Flow has even more accurate readings
- **Mobile app** — The original React Native design is ready to build from the spec
- **Real-time updates** — WebSocket-powered heatmaps that update as students check in
- **Indoor routing** — Add building floor plans for indoor navigation between classes
- **ML predictions** — Train wait time models on historical check-in data instead of simple averaging
- **Accessibility** — Screen reader support, high-contrast mode, voice-guided navigation

---

## Try It

```bash
npm install express
node demo-server.js
# Open http://localhost:3000
```

One dependency. One command. No build step.

## Demo Video

[Click here to see UW Flow in action!](https://youtu.be/CDZN1hn4Ey8)

---

Built with [Kiro](https://kiro.dev), Express, Leaflet.js, and Dijkstra's algorithm. Built for UW, by a Husky. 🐺💜

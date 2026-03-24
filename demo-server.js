// UW Flow — Standalone Demo Server
// Run: node demo-server.js
// Open: http://localhost:3000

const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

// ── Campus Buildings with coordinates ────────────────────────────────────────
const BUILDINGS = {
  "suzzallo":     { name: "Suzzallo Library",     lat: 47.6556, lng: -122.3080 },
  "odegaard":     { name: "Odegaard Library",     lat: 47.6570, lng: -122.3045 },
  "hub":          { name: "HUB",                  lat: 47.6558, lng: -122.3049 },
  "savery":       { name: "Savery Hall",          lat: 47.6567, lng: -122.3095 },
  "kane":         { name: "Kane Hall",            lat: 47.6565, lng: -122.3070 },
  "paccar":       { name: "Paccar Hall",          lat: 47.6545, lng: -122.3085 },
  "meany":        { name: "Meany Hall",           lat: 47.6560, lng: -122.3060 },
  "denny":        { name: "Denny Hall",           lat: 47.6575, lng: -122.3090 },
  "mary-gates":   { name: "Mary Gates Hall",      lat: 47.6553, lng: -122.3065 },
  "allen":        { name: "Allen Library",        lat: 47.6550, lng: -122.3075 },
  "ima":          { name: "IMA",                  lat: 47.6527, lng: -122.3002 },
  "uw-tower":     { name: "UW Tower",             lat: 47.6610, lng: -122.3145 },
  "health-sci":   { name: "Health Sciences",      lat: 47.6505, lng: -122.3055 },
  "engineering":  { name: "Engineering Library",  lat: 47.6535, lng: -122.3010 },
  "gould":        { name: "Gould Hall",           lat: 47.6570, lng: -122.3110 },
  "johnson":      { name: "Johnson Hall",         lat: 47.6575, lng: -122.3075 },
  "mueller":      { name: "Mueller Hall",         lat: 47.6540, lng: -122.3095 },
  "bagley":       { name: "Bagley Hall",          lat: 47.6535, lng: -122.3050 },
  "drumheller":   { name: "Drumheller Fountain",  lat: 47.6535, lng: -122.3065 },
  "red-square":   { name: "Red Square",           lat: 47.6563, lng: -122.3070 },
};

// ── Path segments between buildings ──────────────────────────────────────────
const PATHS = [
  { from: "suzzallo", to: "red-square",  dist: 80,  covered: true,  type: "building_interior" },
  { from: "red-square", to: "kane",      dist: 60,  covered: false, type: "open" },
  { from: "red-square", to: "odegaard",  dist: 100, covered: false, type: "open" },
  { from: "red-square", to: "meany",     dist: 70,  covered: true,  type: "overhang" },
  { from: "kane", to: "savery",          dist: 120, covered: false, type: "open" },
  { from: "kane", to: "johnson",         dist: 80,  covered: true,  type: "walkway" },
  { from: "savery", to: "denny",         dist: 90,  covered: false, type: "open" },
  { from: "savery", to: "gould",         dist: 100, covered: true,  type: "walkway" },
  { from: "hub", to: "red-square",       dist: 150, covered: true,  type: "walkway" },
  { from: "hub", to: "odegaard",         dist: 120, covered: true,  type: "overhang" },
  { from: "odegaard", to: "mary-gates",  dist: 90,  covered: true,  type: "building_interior" },
  { from: "mary-gates", to: "allen",     dist: 60,  covered: true,  type: "building_interior" },
  { from: "allen", to: "suzzallo",       dist: 50,  covered: true,  type: "building_interior" },
  { from: "meany", to: "paccar",         dist: 130, covered: false, type: "open" },
  { from: "paccar", to: "mueller",       dist: 80,  covered: true,  type: "walkway" },
  { from: "drumheller", to: "bagley",    dist: 100, covered: false, type: "open" },
  { from: "drumheller", to: "mary-gates",dist: 110, covered: false, type: "open" },
  { from: "bagley", to: "engineering",   dist: 90,  covered: true,  type: "tunnel" },
  { from: "engineering", to: "ima",       dist: 200, covered: false, type: "open" },
  { from: "denny", to: "gould",          dist: 70,  covered: true,  type: "overhang" },
  { from: "johnson", to: "denny",        dist: 60,  covered: false, type: "open" },
  { from: "hub", to: "ima",              dist: 350, covered: false, type: "open" },
  { from: "health-sci", to: "drumheller",dist: 200, covered: false, type: "open" },
  { from: "health-sci", to: "bagley",    dist: 180, covered: true,  type: "walkway" },
  { from: "gould", to: "uw-tower",       dist: 300, covered: false, type: "open" },
  { from: "hub", to: "meany",            dist: 100, covered: true,  type: "walkway" },
  { from: "paccar", to: "allen",         dist: 110, covered: true,  type: "walkway" },
];

// Make paths bidirectional
const ALL_PATHS = [];
PATHS.forEach(p => {
  ALL_PATHS.push(p);
  ALL_PATHS.push({ from: p.to, to: p.from, dist: p.dist, covered: p.covered, type: p.type });
});

// ── Dijkstra's for driest route ──────────────────────────────────────────────
function findRoute(fromId, toId, preferCovered) {
  const dist = {}, prev = {}, visited = new Set();
  Object.keys(BUILDINGS).forEach(k => dist[k] = Infinity);
  dist[fromId] = 0;

  while (true) {
    let u = null, best = Infinity;
    for (const k of Object.keys(BUILDINGS)) {
      if (!visited.has(k) && dist[k] < best) { best = dist[k]; u = k; }
    }
    if (!u || u === toId) break;
    visited.add(u);

    for (const edge of ALL_PATHS.filter(e => e.from === u)) {
      const weight = preferCovered ? (edge.covered ? edge.dist * 0.5 : edge.dist * 2) : edge.dist;
      const alt = dist[u] + weight;
      if (alt < dist[edge.to]) { dist[edge.to] = alt; prev[edge.to] = u; }
    }
  }

  if (dist[toId] === Infinity) return null;
  const path = []; let cur = toId;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  return path;
}

function buildRouteResult(path, routeType) {
  const segments = [];
  let totalDist = 0, coveredDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = ALL_PATHS.find(e => e.from === path[i] && e.to === path[i+1]);
    if (edge) {
      segments.push({
        from: BUILDINGS[edge.from].name,
        to: BUILDINGS[edge.to].name,
        from_coords: { lat: BUILDINGS[edge.from].lat, lng: BUILDINGS[edge.from].lng },
        to_coords: { lat: BUILDINGS[edge.to].lat, lng: BUILDINGS[edge.to].lng },
        distance_meters: edge.dist,
        covered: edge.covered,
        type: edge.type,
      });
      totalDist += edge.dist;
      if (edge.covered) coveredDist += edge.dist;
    }
  }
  return {
    route_type: routeType,
    buildings: path.map(id => BUILDINGS[id].name),
    coords: path.map(id => ({ lat: BUILDINGS[id].lat, lng: BUILDINGS[id].lng, name: BUILDINGS[id].name })),
    segments,
    total_distance_meters: totalDist,
    estimated_time_minutes: +(totalDist / 80).toFixed(1),
    coverage_score: totalDist > 0 ? Math.round((coveredDist / totalDist) * 100) : 100,
  };
}

// ── Venues & Wait Times (in-memory) ─────────────────────────────────────────
const VENUES = [
  { id: "hub-food-court",   name: "HUB Food Court",        category: "dining" },
  { id: "starbucks-hub",    name: "Starbucks (HUB)",       category: "dining" },
  { id: "local-point",      name: "Local Point",           category: "dining" },
  { id: "district-market",  name: "District Market",       category: "dining" },
  { id: "uw-gym",           name: "UW Gym / IMA",          category: "gym" },
  { id: "suzzallo-lib",     name: "Suzzallo Library",      category: "library" },
  { id: "odegaard-lib",     name: "Odegaard Library",      category: "library" },
  { id: "advising",         name: "Advising Offices",      category: "advising" },
  { id: "hall-health",      name: "Hall Health",           category: "health" },
  { id: "bookstore",        name: "UW Bookstore",          category: "retail" },
  { id: "light-rail",       name: "Link Light Rail",       category: "transit" },
];

const venueState = {};
VENUES.forEach(v => {
  venueState[v.id] = {
    current_wait: Math.floor(Math.random() * 20),
    checkins: [],
    last_checkin_at: null,
  };
});

function getWaitData(venueId) {
  const s = venueState[venueId];
  if (!s) return null;
  const now = Date.now();
  const recent = s.checkins.filter(c => now - c.time < 30 * 60 * 1000);
  const current = recent.length > 0
    ? Math.round(recent.reduce((sum, c) => sum + c.wait, 0) / recent.length)
    : s.current_wait;
  const unverified = !s.last_checkin_at || (now - s.last_checkin_at > 30 * 60 * 1000);

  const preds = [10, 20, 30].map(m => {
    const drift = Math.round((Math.random() - 0.5) * 8);
    const predicted = Math.max(0, current + drift);
    return {
      minutes_from_now: m,
      predicted_wait: predicted,
      recommendation: predicted < current ? "Go Later" : predicted > current ? "Go Now" : null,
    };
  });

  return { current_wait: current, predictions: preds, unverified, checkin_count: recent.length };
}

// ── Heatmap (in-memory) ──────────────────────────────────────────────────────
const HEATMAP_CELLS = [
  { id: "hub-area",        name: "HUB Area",          study: false, type: "common" },
  { id: "red-square",      name: "Red Square",        study: false, type: "common" },
  { id: "suzzallo-area",   name: "Suzzallo Library",  study: true,  type: "library" },
  { id: "quad-area",       name: "The Quad",          study: true,  type: "outdoor" },
  { id: "engineering",     name: "Engineering Library",study: true,  type: "library" },
  { id: "ima-area",        name: "IMA / Gym",         study: false, type: "common" },
  { id: "odegaard-area",   name: "Odegaard Library",  study: true,  type: "library" },
  { id: "health-sci",      name: "Health Sciences",   study: true,  type: "building" },
  { id: "paccar-area",     name: "Paccar Hall",       study: true,  type: "building" },
  { id: "burke-area",      name: "Burke Museum / NE", study: false, type: "common" },
  { id: "light-rail",      name: "Light Rail Station", study: false, type: "common" },
  { id: "local-point-area",name: "Local Point Area",  study: false, type: "common" },
  { id: "allen-area",      name: "Allen Library",     study: true,  type: "library" },
  { id: "mary-gates-area", name: "Mary Gates Hall",   study: true,  type: "building" },
  { id: "kane-area",       name: "Kane Hall",         study: true,  type: "building" },
  { id: "savery-area",     name: "Savery Hall",       study: true,  type: "building" },
  { id: "denny-area",      name: "Denny Hall",        study: true,  type: "building" },
  { id: "gould-area",      name: "Gould Hall",        study: true,  type: "building" },
  { id: "johnson-area",    name: "Johnson Hall",      study: true,  type: "building" },
  { id: "bagley-area",     name: "Bagley Hall",       study: true,  type: "building" },
];

const cellDensity = {};
HEATMAP_CELLS.forEach(c => { cellDensity[c.id] = Math.floor(Math.random() * 80) + 10; });

function labelFor(score) { return score < 35 ? "Quiet" : score < 70 ? "Moderate" : "Busy"; }

// ── API Routes ───────────────────────────────────────────────────────────────

// Buildings list (with coordinates for map)
app.get("/api/buildings", (req, res) => {
  res.json(Object.entries(BUILDINGS).map(([id, b]) => ({ id, name: b.name, lat: b.lat, lng: b.lng })));
});

// Dry routes
app.get("/api/routes/dry", (req, res) => {
  const { from, to } = req.query;
  if (!from || !to || !BUILDINGS[from] || !BUILDINGS[to]) {
    return res.status(400).json({ error: "Invalid from/to building IDs" });
  }
  if (from === to) return res.json([{ route_type: "same_location", buildings: [BUILDINGS[from].name], segments: [], total_distance_meters: 0, estimated_time_minutes: 0, coverage_score: 100 }]);

  const results = [];
  const dryPath = findRoute(from, to, true);
  if (dryPath) results.push(buildRouteResult(dryPath, "Driest Route 🌧️"));
  const fastPath = findRoute(from, to, false);
  if (fastPath) results.push(buildRouteResult(fastPath, "Fastest Route ⚡"));
  // Dedupe if same
  if (results.length === 2 && JSON.stringify(results[0].buildings) === JSON.stringify(results[1].buildings)) results.pop();
  res.json(results);
});

// Route votes (in-memory)
const routeVotes = {};

// Vote for a route
app.post("/api/routes/vote", (req, res) => {
  const key = req.body.route_key;
  if (!key) return res.status(400).json({ error: "Missing route_key" });
  if (!routeVotes[key]) routeVotes[key] = 0;
  routeVotes[key]++;
  res.json({ route_key: key, votes: routeVotes[key] });
});
app.get("/api/routes/votes", (req, res) => {
  res.json(routeVotes);
});

// Venues
app.get("/api/venues", (req, res) => res.json(VENUES));
app.get("/api/venues/:id/wait-time", (req, res) => {
  const data = getWaitData(req.params.id);
  if (!data) return res.status(404).json({ error: "Venue not found" });
  res.json(data);
});

// Check-in
app.post("/api/venues/:id/checkin", (req, res) => {
  const s = venueState[req.params.id];
  if (!s) return res.status(404).json({ error: "Venue not found" });
  const { wait_minutes, crowd_level } = req.body;
  s.checkins.push({ wait: wait_minutes || 5, crowd: crowd_level || "medium", time: Date.now() });
  s.last_checkin_at = Date.now();
  res.json({ accepted: true });
});

// Heatmap
app.get("/api/heatmap", (req, res) => {
  res.json({ cells: HEATMAP_CELLS.map(c => ({ ...c, density: cellDensity[c.id], label: labelFor(cellDensity[c.id]) })), generated_at: new Date().toISOString() });
});
app.get("/api/heatmap/quiet-spots", (req, res) => {
  const study = HEATMAP_CELLS.filter(c => c.study).map(c => ({ ...c, density: cellDensity[c.id], label: labelFor(cellDensity[c.id]) }));
  study.sort((a, b) => a.density - b.density);
  res.json(study.slice(0, 3));
});

// Chat / Ask Flow
app.post("/api/chat", (req, res) => {
  const q = (req.body.message || "").toLowerCase();
  const allCells = HEATMAP_CELLS.map(c => ({ ...c, density: cellDensity[c.id], label: labelFor(cellDensity[c.id]) }));
  const studyCells = allCells.filter(c => c.study);
  const allWaits = VENUES.map(v => ({ ...v, ...getWaitData(v.id) }));

  // Check if asking about a specific place
  const placeMatch = allCells.find(c => q.includes(c.name.toLowerCase().split("/")[0].trim().split(" ")[0].toLowerCase()));
  const venueMatch = allWaits.find(v => q.includes(v.name.toLowerCase().split("(")[0].trim().split(" ")[0].toLowerCase()));

  let reply = "";

  if (q.match(/how busy|how packed|how crowded|status of|what.s.*like/) && (placeMatch || venueMatch)) {
    if (placeMatch) {
      const d = placeMatch.density;
      const emoji = d < 35 ? "Nice and quiet" : d < 70 ? "Moderately busy" : "Pretty packed";
      reply = placeMatch.name + " is at " + d + "% capacity right now. " + emoji + "!";
      if (placeMatch.study && d < 50) reply += " Great time to grab a study spot.";
      if (d > 70) reply += " You might want to try somewhere else.";
    }
    if (venueMatch && !placeMatch) {
      reply = venueMatch.name + ": " + venueMatch.current_wait + " min wait. " + (venueMatch.unverified ? "(unverified)" : "(recently reported)");
    }
  } else if (q.match(/quiet|empty|chill|peaceful|calm|least busy/)) {
    const top = studyCells.sort((a,b) => a.density - b.density).slice(0, 3);
    reply = "Quietest study spots rn:\n" + top.map((s,i) => (i+1) + ". " + s.name + " - " + s.density + "% (" + s.label + ")").join("\n");
  } else if (q.match(/busy|crowded|packed|full|avoid/)) {
    const busy = allCells.sort((a,b) => b.density - a.density).slice(0, 3);
    reply = "Busiest areas:\n" + busy.map((s,i) => (i+1) + ". " + s.name + " - " + s.density + "% (" + s.label + ")").join("\n");
  } else if (q.match(/study|library|read|work|homework/)) {
    const spots = studyCells.sort((a,b) => a.density - b.density);
    reply = "Study spots (least busy first):\n" + spots.map((s,i) => (i+1) + ". " + s.name + " - " + s.density + "% (" + s.label + ")").join("\n");
  } else if (q.match(/food|eat|dining|hungry|lunch|coffee|starbucks/)) {
    const food = allWaits.filter(v => v.category === "dining").sort((a,b) => a.current_wait - b.current_wait);
    reply = "Dining (shortest wait):\n" + food.map((v,i) => (i+1) + ". " + v.name + " - " + v.current_wait + " min").join("\n");
  } else if (q.match(/gym|workout|exercise|ima/)) {
    const gym = allWaits.find(v => v.category === "gym");
    reply = gym ? (gym.name + ": " + gym.current_wait + " min wait right now") : "No gym data.";
  } else if (q.match(/wait|line|how long/)) {
    const sorted = allWaits.sort((a,b) => a.current_wait - b.current_wait);
    reply = "Wait times:\n" + sorted.map((v,i) => (i+1) + ". " + v.name + " - " + v.current_wait + " min").join("\n");
  } else if (q.match(/recommend|suggest|should i|where should|what should/)) {
    const bestStudy = studyCells.sort((a,b) => a.density - b.density)[0];
    const bestFood = allWaits.filter(v => v.category === "dining").sort((a,b) => a.current_wait - b.current_wait)[0];
    reply = "Here's what I'd suggest:\nStudy: " + bestStudy.name + " (" + bestStudy.density + "% full)\nEat: " + bestFood.name + " (" + bestFood.current_wait + " min wait)";
  } else if (q.match(/hi|hello|hey|sup|yo/)) {
    reply = "Hey! I'm Flow, your UW campus assistant. Ask me things like:\n- \"How busy is Suzzallo?\"\n- \"Where should I study?\"\n- \"Best place to eat?\"\n- \"How long is the gym wait?\"";
  } else {
    const qt = studyCells.sort((a,b) => a.density - b.density)[0];
    const bs = allCells.sort((a,b) => b.density - a.density)[0];
    reply = "Campus right now:\nQuietest: " + qt.name + " (" + qt.density + "%)\nBusiest: " + bs.name + " (" + bs.density + "%)\n\nTry asking \"how busy is Suzzallo?\" or \"where should I study?\"";
  }
  res.json({ reply });
});

// ── Serve the web UI ─────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "demo.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("  🌦️  UW Flow is running!");
  console.log(`  Open http://localhost:${PORT} in your browser`);
  console.log("");
});

import express from "express";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticate, rateLimit } from "./auth";

const app = express();

// Global middleware
app.use(rateLimit);
app.use(authenticate);
app.use(express.json());

// Serve the web dashboard
app.use(express.static(path.join(__dirname, "..", "public")));

// Service URLs (configurable via env)
const DRY_ROUTE_URL = process.env.DRY_ROUTE_URL ?? "http://localhost:3001";
const WAIT_TIME_URL = process.env.WAIT_TIME_URL ?? "http://localhost:3002";
const HEATMAP_URL = process.env.HEATMAP_URL ?? "http://localhost:3003";
const ROUTE_PLANNER_URL = process.env.ROUTE_PLANNER_URL ?? "http://localhost:3004";
const ALERT_URL = process.env.ALERT_URL ?? "http://localhost:3005";

// Proxy routes to microservices
app.use("/api/routes/dry", createProxyMiddleware({ target: DRY_ROUTE_URL, pathRewrite: { "^/api/routes/dry": "/routes/dry" }, changeOrigin: true }));
app.use("/api/routes/smart", createProxyMiddleware({ target: ROUTE_PLANNER_URL, pathRewrite: { "^/api/routes/smart": "/routes/smart" }, changeOrigin: true }));
app.use("/api/venues", createProxyMiddleware({ target: WAIT_TIME_URL, pathRewrite: { "^/api/venues": "/venues" }, changeOrigin: true }));
app.use("/api/heatmap", createProxyMiddleware({ target: HEATMAP_URL, pathRewrite: { "^/api/heatmap": "/heatmap" }, changeOrigin: true }));
app.use("/api/alerts", createProxyMiddleware({ target: ALERT_URL, pathRewrite: { "^/api/alerts": "/alerts" }, changeOrigin: true }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Gateway listening on port ${PORT}`);
  });
}

export { app };

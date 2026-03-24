import express from "express";
import { createServer } from "http";
import { router } from "./routes";
import { attachWebSocket, pushRefreshedSnapshot } from "./ws";
import { startRefreshCycle } from "./heatmap";

export * from "./heatmap";
export * from "./grid";

const app = express();
app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;

if (require.main === module) {
  const server = createServer(app);
  attachWebSocket(server);

  // Start ≤2-minute refresh cycle, push to WebSocket clients on each tick
  startRefreshCycle(2 * 60 * 1000);
  setInterval(() => pushRefreshedSnapshot(), 2 * 60 * 1000);

  server.listen(PORT, () => {
    console.log(`Heatmap_Service listening on port ${PORT}`);
  });
}

export { app };

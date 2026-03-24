import express from "express";
import { createServer } from "http";
import { router } from "./routes";
import { attachRoutesWebSocket } from "./ws";

export * from "./planner";

const app = express();
app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;

if (require.main === module) {
  const server = createServer(app);
  attachRoutesWebSocket(server);
  server.listen(PORT, () => {
    console.log(`Route_Planner listening on port ${PORT}`);
  });
}

export { app };

import express from "express";
import { routesRouter, rainService } from "./routes";

export * from "./routes";
export * from "./graph";
export * from "./coverage";
export * from "./seed";

const app = express();
app.use(express.json());
app.use("/routes", routesRouter);

const PORT = process.env.PORT ?? 3001;

if (require.main === module) {
  rainService.startRefreshLoop();
  app.listen(PORT, () => {
    console.log(`dry-route-engine listening on port ${PORT}`);
  });
}

export { app };

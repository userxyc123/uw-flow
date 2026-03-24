import express from "express";
import { router } from "./routes";

export * from "./venues";
export * from "./aggregator";
export * from "./predictor";
export * from "./location-tracker";

const app = express();
app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Wait_Time_Service listening on port ${PORT}`);
  });
}

export { app };

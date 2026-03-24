import express from "express";
import { router } from "./routes";

export * from "./alerts";

const app = express();
app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Alert_Service listening on port ${PORT}`);
  });
}

export { app };

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as middlewares from "./lib/middlewares";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const port = 3003;

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

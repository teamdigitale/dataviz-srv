import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as middlewares from "./lib/middlewares.ts";
import authRouter from "./routes/auth.ts";
import chartRouter from "./routes/charts.ts";
// import seedUsers from "./seeds/seed-users.ts";
import * as db from "./lib/db.ts";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(middlewares.deserializeUser);
const port = 3003;

app.get("/", (req, res) => {
  res.json("Hello World!");
});

/*
app.get("/seed", (req, res) => {
  const result = seedUsers();
  res.json({ result });
});

app.get("/users", async (req, res) => {
  const results = await db.getUsers();
  res.json(
    results.map((user: any) => {
      delete user.password;
      return user;
    })
  );
});
*/

app.use("/auth", authRouter as Router);
app.use("/charts", chartRouter as Router);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

export default app;

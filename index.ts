import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as middlewares from "./lib/middlewares.ts";
import authRouter from "./routes/auth.ts";
import chartRouter from "./routes/charts.ts";
import dashRouter from "./routes/dashboards.ts";
import suggestionsRouter from "./routes/hints.ts";
// import swaggerJsdoc from "swagger-jsdoc";
// import swaggerUi from "swagger-ui-express";
// import seedUsers from "./seeds/seed-users.ts";
// import * as db from "./lib/db.ts";

const HOST = process?.env.HOST || "http://localhost";
const PORT = process?.env.PORT || 3003;
const whitelist = process?.env.DOMAINS?.split(",") || `${HOST}:${PORT}`;
const app = express();

app.use(helmet());
// app.use(
//   cors({
//     origin: whitelist,
//     // credentials: true,
//     // origin: whitelist,
//     // methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
//   })
// );
app.use(
  cors({
    origin: ["localhost", HOST, `${HOST}:${PORT}`],
    credentials: true,
    methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
// app.use(express.bodyParser({ limit: "2mb" }));

// const options = {
//   definition: {
//     openapi: "3.1.0",
//     info: {
//       title: "Dataviz API",
//       version: "0.1.0",
//       description: "Api to create and publish simple charts and their data",
//       license: {
//         name: "MIT",
//         url: "https://spdx.org/licenses/MIT.html",
//       },
//       contact: {
//         name: "LogRocket",
//         url: "https://dataviz.developers.it",
//         email: "contacts@developers.it",
//       },
//     },
//     servers: [
//       {
//         url: `${HOST}:${PORT}`,
//       },
//     ],
//   },
//   apis: ["./routes/*.ts"],
// };

// const specs = swaggerJsdoc(options);
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(specs, {
//     explorer: true,
//     customCssUrl:
//       "https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-newspaper.css",
//   })
// );

app.use(cookieParser());
app.use(middlewares.checkAuth);
app.use(express.json({ limit: "5Mb" }));

// app.get("/", (req, res) => {
//   res.json("^^");
// });

/* SEED - Decommentare se serve
app.get("/seed", (req, res) => {
  const result = seedUsers();
  res.json({ result });
});
*/

app.use("/api/auth", authRouter as Router);
app.use("/api/charts", chartRouter as Router);
app.use("/api/dashboards", dashRouter as Router);
app.use("/api/hints", suggestionsRouter as Router);

// Error handling middleware
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

// process.on("SIGINT", async () => {
//   console.log("SIGINT received, shutting down gracefully...");

//   try {
//     const { prisma } = await import("./lib/db.ts");
//     await prisma.$disconnect();
//     console.log("Database connections closed");
//   } catch (error) {
//     console.error("Error closing database connections:", error);
//   }

//   process.exit(0);
// });

// Start server
app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`🚀 DataViz Server listening on PORT ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ready check: http://localhost:${PORT}/ready`);

  if (process.env.NODE_ENV !== "production") {
    console.log(`📖 API docs: http://localhost:${PORT}/`);
  }
});

export default app;

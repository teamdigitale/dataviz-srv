import express, { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as middlewares from './lib/middlewares.ts';
import authRouter from './routes/auth.ts';
import chartRouter from './routes/charts.ts';
import dashRouter from './routes/dashboards.ts';
import suggestionsRouter from './routes/hints.ts';
// import seedUsers from "./seeds/seed-users.ts";
// import * as db from "./lib/db.ts";

const whitelist = process?.env.DOMAINS?.split(',') || 'http://localhost:3000';

const app = express();

// app.use(helmet());
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
    origin: ['localhost', 'http://localhost:3000'],
    credentials: true,
    methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);
// app.use(express.bodyParser({ limit: "2mb" }));
app.use(cookieParser());
app.use(middlewares.checkAuth);
app.use(express.json({ limit: '500kb' }));
const port = 3003;

app.get('/', (req, res) => {
  res.json('^^');
});

/* SEED
app.get("/seed", (req, res) => {
  const result = seedUsers();
  res.json({ result });
});
*/

app.use('/api/auth', authRouter as Router);
app.use('/api/charts', chartRouter as Router);
app.use('/api/dashboards', dashRouter as Router);
app.use('/api/hints', suggestionsRouter as Router);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

export default app;

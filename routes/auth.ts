import { Router } from "express";
import * as bcrypt from "bcrypt";
import * as db from "../lib/db";
import { generateTokens, sendAccessToken } from "../lib/jwt";
import { validateRequest } from "../lib/middlewares";
import * as z from "zod";

const registerSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email or password"),
  password: z
    .string({ required_error: "Password is required" })
    .min(7, "Password must be at least 7 characters long"),
});

const router = Router();

router.get("/user", (req: any, res) => {
  console.log("check user");
  try {
    const user = req?.user || null;
    console.log("user", user);
    if (!user) {
      res.status(401).json(null);
    }
    return res.status(201).json({ user });
  } catch (error) {
    console.log("ERROR", error);
  }
  return res.json({ message: "hello" });
});

router.post(
  "/register",
  validateRequest({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400);
        throw new Error("You must provide an email and a password.");
      }
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        res.status(400);
        throw new Error("Email already in use.");
      }
      const user = await db.createUserByEmailAndPassword({ email, password });

      //@TODO SEND EMAIL TO ACTIVATE USER

      const { accessToken } = generateTokens(user);

      sendAccessToken(res, accessToken);
      // res.json({
      //   accessToken,
      // });
      res.json({ auth: true });
    } catch (err) {
      next(err);
    }
  }
);

const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email or password"),
  password: z.string({ required_error: "Password is required" }),
});

router.post(
  "/login",
  validateRequest({ body: loginSchema }),
  async (req, res, next) => {
    console.log("login");
    try {
      const { email, password } = req.body;
      const existingUser = await db.findUserByEmail(email);
      if (!existingUser) {
        res.status(401);
        throw new Error("Invalid login credentials.");
      }
      const validPassword = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!validPassword) {
        res.status(401);
        throw new Error("Invalid login credentials.");
      }
      const { accessToken } = generateTokens(existingUser);
      sendAccessToken(res, accessToken);
      // res.json({
      //   accessToken,
      // });
      res.json({ auth: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/logout", (req: any, res) => {
  res.clearCookie("access_token");
  return res.status(204);
});

export default router;

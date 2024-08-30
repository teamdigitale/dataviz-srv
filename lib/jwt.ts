import crypto from "crypto";
import * as jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import type { Response } from "express";

const JWT_SECRET = process?.env["JWT_SECRET"] || "";
const EXPIRE = 1000 * 60 * 60 * 24 * 7; // 7 days in millis

export interface IAccessTokenPayload {
  userId: User["id"];
}
export interface IRefreshTokenPayload {
  userId: User["id"];
  jti: string;
}

// Usually I keep the token between 5 minutes - 15 minutes
export function generateAccessToken(
  payload: IAccessTokenPayload,
  expiresIn: string | number = EXPIRE
) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
}

export function generateTokens(user: User, jti: string) {
  const accessTokenPayload: IAccessTokenPayload = {
    userId: user.id,
  };
  const accessToken = generateAccessToken(accessTokenPayload);

  return {
    accessToken,
  };
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as IAccessTokenPayload;
  } catch (error) {
    throw error;
  }
}

export function hashToken(token: string) {
  return crypto.createHash("sha512").update(token).digest("hex");
}

export function sendRefreshToken(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: false,
    path: "/auth",
  });
}

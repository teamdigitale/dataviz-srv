import crypto from "crypto";
import * as jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import type { Response } from "express";

const JWT_SECRET = process?.env["JWT_SECRET"] || "";
// const EXPIRE = 60; //seconds
const EXPIRE = "1d";

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
  console.log("Generating AccessToken", payload);
  console.log("expiresIn", expiresIn);

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
}

export function generateTokens(user: User) {
  const accessTokenPayload: IAccessTokenPayload = {
    userId: user.id,
  };
  const accessToken = generateAccessToken(accessTokenPayload);

  return {
    accessToken,
  };
}

export function verifyAccessToken(token: string) {
  // console.log("Verifying AccessToken", token);
  try {
    return jwt.verify(token, JWT_SECRET) as IAccessTokenPayload;
  } catch (error) {
    console.log("Error verifyng AccessToken", error);
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

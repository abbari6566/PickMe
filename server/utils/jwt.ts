import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export function generateAccessToken(userId: number): string {
  return jwt.sign({ sub: userId }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });
}

import { generateAccessToken } from "../utils/jwt.ts";
import { prisma } from "../lib/prisma.ts";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { ServiceError } from "../utils/ServiceError.ts";

export async function refreshTokenService(refreshToken: string) {
  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    );
    // Existing tokens store the numeric database ID in sub.
    const userId: unknown = typeof decodedToken === "object" ? decodedToken.sub : undefined;
    if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
      throw new ServiceError(401, "Invalid refresh token");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        refreshTokens: {
          some: {
            tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
            expiresAt: { gt: new Date() },
          },
        },
      },
    });
    if (!user) {
      throw new ServiceError(401, "Invalid refresh token");
    }
    const accessToken = generateAccessToken(user.id);
    return { accessToken };
  } catch (error) {
    if (error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")) {
      throw new ServiceError(401, "Invalid or expired refresh token");
    }
    throw error;
  }
}

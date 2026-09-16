import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.ts";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(match[1], process.env.ACCESS_TOKEN_SECRET!);
    // Our token helpers put the numeric database ID in sub, not id.
    const userId: unknown =
      typeof decoded === "object" ? decoded.sub : undefined;

    if (
      typeof userId !== "number" ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isDriver: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError
    ) {
      return res
        .status(401)
        .json({ message: "Invalid or expired access token" });
    }
    return next(error);
  }
}

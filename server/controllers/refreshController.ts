import type { Request, Response, NextFunction } from "express";
import { refreshTokenService } from "../services/refreshService.ts";

export async function refreshTokenController(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken: unknown = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    if (typeof refreshToken !== "string") {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    const result = await refreshTokenService(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

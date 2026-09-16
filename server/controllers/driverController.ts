import type { Request, Response, NextFunction } from "express";
import { acceptRideService } from "../services/driverService.ts";

type AcceptRideRequestBody = {
  rideId?: unknown;
};

type AcceptRideRequest = Request<unknown, unknown, AcceptRideRequestBody>;

export async function acceptRideController(
  req: AcceptRideRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.user.isDriver) {
    return res
      .status(403)
      .json({ message: "Forbidden: Only drivers can accept rides" });
  }
  const { rideId } = req.body ?? {};
  if (
    typeof rideId !== "number" ||
    !Number.isSafeInteger(rideId) ||
    rideId <= 0 ||
    rideId > 2147483647
  ) {
    return res.status(400).json({ message: "Invalid ride ID" });
  }
  try {
    const updatedRide = await acceptRideService({
      rideId,
      driverId: req.user.id,
    });
    return res.json(updatedRide);
  } catch (error) {
    next(error);
  }
}

import type { Request, Response, NextFunction } from "express";
import { bookRideService } from "../services/passengerService.ts";

type BookRideRequestBody = {
  pickupLocation?: unknown;
};

type BookRideRequest = Request<unknown, unknown, BookRideRequestBody>;

export async function bookRideController(
  req: BookRideRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { pickupLocation } = req.body ?? {};
    if (typeof pickupLocation !== "string") {
      return res.status(400).json({ message: "Invalid pickup location" });
    }
    const normalizedPickupLocation = pickupLocation.trim();
    if (!normalizedPickupLocation) {
      return res.status(400).json({ message: "Put pickup location" });
    }
    const ride = await bookRideService({
      pickupLocation: normalizedPickupLocation,
      userId: req.user.id,
    });
    return res.status(201).json({ message: "Ride booked successfully", ride });
  } catch (error) {
    return next(error);
  }
}

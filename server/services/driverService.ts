import { prisma } from "../lib/prisma.ts";
import { ServiceError } from "../utils/ServiceError.ts";

type AcceptRideInput = {
  driverId: number;
  rideId: number;
};

export async function acceptRideService({ driverId, rideId }: AcceptRideInput) {
  // The condition and assignment run in one statement so only one driver wins.
  const rides = await prisma.ride.updateManyAndReturn({
    where: { id: rideId, driverId: null, status: "REQUESTED" },
    data: { driverId, status: "ACCEPTED" },
  });

  const acceptedRide = rides[0];
  if (acceptedRide) return acceptedRide;

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { id: true },
  });

  if (!ride) {
    throw new ServiceError(404, "Ride not found");
  }
  throw new ServiceError(409, "Ride is no longer available");
}

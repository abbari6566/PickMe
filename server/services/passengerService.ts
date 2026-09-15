import { prisma } from "../lib/prisma.ts";
import { ServiceError } from "../utils/ServiceError.ts";
type BookRideInput = {
  pickupLocation: string;
  userId: number;
};

export async function bookRideService({
  userId,
  pickupLocation,
}: BookRideInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ServiceError(404, "User not found");
  }
  //if the user is correct, createa new ride
  //push that into the database and rretur the object of the ride
  const ride = await prisma.ride.create({
    data: {
      pickupLocation,
      userId,
    },
  });
  return ride;
}

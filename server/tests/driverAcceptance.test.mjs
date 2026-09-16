import assert from "node:assert/strict";
import { mock, test } from "node:test";

const updateManyAndReturn = mock.fn();
const findUnique = mock.fn();
mock.module("../lib/prisma.ts", {
  namedExports: { prisma: { ride: { updateManyAndReturn, findUnique } } },
});
const { acceptRideService } = await import("../services/driverService.ts");
const { acceptRideController } = await import("../controllers/driverController.ts");

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("authentication and role checks reject unauthorized callers", async () => {
  for (const [user, code] of [[undefined, 401], [{ id: 2, isDriver: false }, 403]]) {
    const res = response();
    await acceptRideController({ user, body: { rideId: 1 } }, res, assert.fail);
    assert.equal(res.statusCode, code);
  }
});

test("missing and invalid ride IDs return 400", async () => {
  for (const body of [undefined, null, {}, { rideId: "1" }, { rideId: 0 },
    { rideId: -1 }, { rideId: 1.5 }, { rideId: 2147483648 }]) {
    const res = response();
    await acceptRideController({ user: { id: 2, isDriver: true }, body }, res, assert.fail);
    assert.equal(res.statusCode, 400);
  }
});

test("acceptance uses authenticated driver and preserves passenger details", async () => {
  const ride = { id: 1, userId: 3, pickupLocation: "Station", driverId: 2, status: "ACCEPTED" };
  updateManyAndReturn.mock.mockImplementation(async (query) => {
    assert.deepEqual(query, {
      where: { id: 1, driverId: null, status: "REQUESTED" },
      data: { driverId: 2, status: "ACCEPTED" },
    });
    return [ride];
  });
  const res = response();
  await acceptRideController({
    user: { id: 2, isDriver: true },
    body: { rideId: 1, driverId: 999, passengerId: 999, pickupLocation: "Changed" },
  }, res, assert.fail);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, ride);
});

test("an unsuccessful claim distinguishes missing from unavailable rides", async () => {
  updateManyAndReturn.mock.mockImplementation(async () => []);
  findUnique.mock.mockImplementation(async () => null);
  await assert.rejects(acceptRideService({ rideId: 1, driverId: 2 }), { statusCode: 404 });
  findUnique.mock.mockImplementation(async () => ({ id: 1 }));
  await assert.rejects(acceptRideService({ rideId: 1, driverId: 2 }), { statusCode: 409 });
});

test("database failures reach the error middleware", async () => {
  const failure = new Error("Database unavailable");
  updateManyAndReturn.mock.mockImplementation(async () => { throw failure; });
  let forwarded;
  await acceptRideController({ user: { id: 2, isDriver: true }, body: { rideId: 1 } },
    response(), (error) => { forwarded = error; });
  assert.equal(forwarded, failure);
});

import express from "express";
import { acceptRideController } from "../controllers/driverController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const driverRouter = express.Router();

driverRouter.post("/acceptride", authMiddleware, acceptRideController);

export default driverRouter;

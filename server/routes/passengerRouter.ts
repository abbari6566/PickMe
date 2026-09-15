import express from "express";
import { bookRideController } from "../controllers/passengerController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const passengerRouter = express.Router();

passengerRouter.post("/bookride", authMiddleware, bookRideController);

export default passengerRouter;

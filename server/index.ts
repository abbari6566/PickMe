import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { ServiceError } from "./utils/ServiceError.ts";
import authRouter from "./routes/authRouter.ts";
import passengerRouter from "./routes/passengerRouter.ts";

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/passenger", passengerRouter);

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  if (error?.code === "P2002") {
    return res.status(409).json({ message: "User already exists" });
  }
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  return res.status(500).json({ message: "Internal server error" });
};
app.use(errorHandler);

app.listen(process.env.PORT!, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

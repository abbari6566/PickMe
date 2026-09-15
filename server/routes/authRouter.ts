import express from "express";

import {
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/authController.ts";

import { refreshTokenController } from "../controllers/refreshController.ts";

const authRouter = express.Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password/:token", resetPasswordController);
authRouter.post("/refresh", refreshTokenController);

export default authRouter;

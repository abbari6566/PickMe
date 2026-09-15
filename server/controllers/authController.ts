import type { Request, Response, NextFunction } from "express";
import { signupService, loginService, forgotPasswordService, resetPasswordService } from "../services/authService.ts";

type AuthRequestBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  age?: unknown;
  confirmPassword?: unknown;
};

type AuthRequest = Request<Record<string, string>, unknown, AuthRequestBody>;

export async function signupController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const { name, email, password, age } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  }
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (typeof age !== "number" || !Number.isInteger(age) || age < 18) {
    return res
      .status(400)
      .json({ message: "Age must be a number and at least 18" });
  }

  if (!trimmedName || !trimmedEmail || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      message: "Password must have at least 8 characters and at most 72 bytes",
    });
  }

  const { accessToken, refreshToken } = await signupService({
    name: trimmedName, email: trimmedEmail, password, age,
  });
  return res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY!),
    })
    .status(201)
    .json({ message: "User created successfully", accessToken });
}

export async function loginController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const normalizedEmail = email?.trim().toLowerCase();

    const { accessToken, refreshToken } = await loginService({
      email: normalizedEmail, password,
    });

    return res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY!),
      })
      .status(200)
      .json({ message: "User logged in successfully", accessToken });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPasswordController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await forgotPasswordService(email);

    return res.status(200).json({
      message: "If that account exists, a reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPasswordController(
  req: Request<{ token: string }, unknown, AuthRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const receivedToken = req.params.token;
    const { password, confirmPassword } = req.body ?? {};

    if (
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "Password and confirmation are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters and at most 72 bytes",
      });
    }

    await resetPasswordService(receivedToken, password);

    return res.status(200).json({
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    return next(error);
  }
}

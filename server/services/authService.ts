import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.ts";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.ts";
import { ServiceError } from "../utils/ServiceError.ts";

type LoginInput = {
  email: string;
  password: string;
};
type SignupInput = LoginInput & {
  name: string;
  age: number;
};

async function createSession(userId: number) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expiresAt: new Date(
        Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRY),
      ),
    },
  });
  return { accessToken, refreshToken };
}

export async function signupService({
  name,
  email,
  password,
  age,
}: SignupInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ServiceError(400, "User already exists");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, age, passwordHash },
  });
  return createSession(user.id);
}

export async function loginService({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ServiceError(400, "User not found");
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid)
    throw new ServiceError(400, "Invalid email or password");
  return createSession(user.id);
}

export async function forgotPasswordService(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // The controller returns the same response even when the account is absent.
  if (!user) return;
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  // await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPasswordService(
  receivedToken: string,
  password: string,
): Promise<void> {
  const receivedTokenHash = crypto
    .createHash("sha256")
    .update(receivedToken)
    .digest("hex");
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: receivedTokenHash,
      resetPasswordExpiresAt: { gt: new Date() },
    },
  });
  if (!user) throw new ServiceError(400, "Reset token is invalid or expired");
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.update({
      where: {
        id: user.id,
        resetPasswordToken: receivedTokenHash,
        resetPasswordExpiresAt: { gt: new Date() },
      },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        refreshTokens: { deleteMany: {} },
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      throw new ServiceError(400, "Reset token is invalid or expired");
    }
    throw error;
  }
}

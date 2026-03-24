import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { loginSchema, signupRequestSchema, changePasswordSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function authRoutes(app: FastifyInstance) {
  // Protected: current user (requires valid JWT)
  app.get("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }
    return reply.send({ user });
  });

  app.post("/signup", async (request, reply) => {
    try {
      // Validate request body
      const data = signupRequestSchema.parse(request.body);

      // Check if email or username is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existingUser) {
        return reply
          .status(400)
          .send({ error: "Email or username already taken" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user with auth credential
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          auth: {
            create: {
              passwordHash,
            },
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
        },
      });

      const token = signToken({ userId: user.id });
      return reply.status(201).send({ user, token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /auth/change-password — change password for logged-in user
  app.post("/change-password", { preHandler: [requireAuth] }, async (request, reply) => {
    const payload = request.user as { userId: string };
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);

      const userWithAuth = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { auth: true },
      });

      if (!userWithAuth?.auth) {
        return reply.status(404).send({ error: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, userWithAuth.auth.passwordHash);
      if (!isValid) {
        return reply.status(400).send({ error: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.authCredential.update({
        where: { userId: payload.userId },
        data: { passwordHash: newHash },
      });

      return reply.status(204).send();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /auth/forgot-password — send password reset email
  app.post("/forgot-password", async (request, reply) => {
    const { email } = request.body as { email?: string };
    if (!email) return reply.status(400).send({ error: "Email is required" });

    // Always return 204 to avoid leaking whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(204).send();

    // Invalidate any existing unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.APP_URL ?? "http://localhost:5173"}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: "Reset your BookTalk password",
      html: `
        <p>Hi ${user.displayName},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return reply.status(204).send();
  });

  // POST /auth/reset-password — set new password using reset token
  app.post("/reset-password", async (request, reply) => {
    const { token, newPassword } = request.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      return reply.status(400).send({ error: "Token and new password are required" });
    }
    if (newPassword.length < 8) {
      return reply.status(400).send({ error: "Password must be at least 8 characters" });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return reply.status(400).send({ error: "Invalid or expired reset link" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.authCredential.update({
        where: { userId: resetToken.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return reply.status(204).send();
  });

  app.post("/login", async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.identifier }, { username: data.identifier }],
        },
        include: {
          auth: true, // include hashed password
        },
      });

      if (!user || !user.auth) {
        return reply.status(400).send({ error: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.auth.passwordHash,
      );
      if (!isPasswordValid) {
        return reply.status(400).send({ error: "Invalid credentials" });
      }

      const token = signToken({ userId: user.id });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        },
        token,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ errors: err.issues });
      }
      console.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}

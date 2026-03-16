import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { loginSchema, signupRequestSchema } from "@booktalk/shared";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

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

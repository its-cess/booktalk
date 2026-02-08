import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { loginSchema, signupSchema } from "../schemas/auth.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signup", async (request, reply) => {
    try {
      // Validate request body
      const data = signupSchema.parse(request.body);

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

      return reply.status(201).send({ user });
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

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        },
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

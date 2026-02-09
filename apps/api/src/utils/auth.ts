// apps/api/src/plugins/auth.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token) as { userId: string };

    // attach userId to request for later use
    (request as any).userId = payload.userId;
  } catch (err) {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

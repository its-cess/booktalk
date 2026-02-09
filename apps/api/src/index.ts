import "dotenv/config";
import Fastify from "fastify";
import authRoutes from "./routes/auth.js";
import jwt from "@fastify/jwt";

const app = Fastify({
  logger: true,
});

app.register(jwt, {
  secret: process.env.JWT_SECRET! ?? "dev-secret-change-me",
});

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Auth routes
app.register(authRoutes, { prefix: "/auth" });

const port = 3000;

app.listen({ port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

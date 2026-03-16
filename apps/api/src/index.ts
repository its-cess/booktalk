import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import jwt from "@fastify/jwt";

const app = Fastify({
  logger: true,
});

// Allow frontend (Vite dev server) to call the API
app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  credentials: true,
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
app.register(postRoutes, { prefix: "/posts" });
app.register(userRoutes, { prefix: "/users" });

const port = 3000;

app.listen({ port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

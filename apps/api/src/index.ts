import "dotenv/config";
import Fastify from "fastify";
import { prisma } from "./prisma.js";
import authRoutes from "./routes/auth.js";

const app = Fastify({
  logger: true,
});

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Auth routes
await authRoutes(app);

const port = 3000;

app.listen({ port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

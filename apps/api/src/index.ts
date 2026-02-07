import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return { status: "ok" };
});

const port = 3000;

app.listen({ port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

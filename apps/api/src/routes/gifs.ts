import { FastifyInstance } from "fastify";

interface GiphyImage {
  url: string;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height_small?: GiphyImage;
    preview_gif?: GiphyImage;
    downsized?: GiphyImage;
    original?: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyGif[];
}

export default async function gifRoutes(app: FastifyInstance) {
  app.get("/search", async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.trim().length < 1) {
      return reply.send({ gifs: [] });
    }

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return reply.status(503).send({ error: "GIF search not configured" });
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q.trim())}&limit=24&rating=g`;

    const res = await fetch(url);
    if (!res.ok) {
      return reply.status(502).send({ error: "Failed to fetch GIFs" });
    }

    const json = (await res.json()) as GiphyResponse;

    const gifs = json.data.map((gif) => ({
      id: gif.id,
      title: gif.title,
      previewUrl: gif.images.fixed_height_small?.url ?? gif.images.preview_gif?.url ?? "",
      gifUrl: gif.images.downsized?.url ?? gif.images.original?.url ?? "",
    }));

    return reply.send({ gifs });
  });
}

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Resend } from "resend";
import { feedbackSchema, FEEDBACK_TYPE_LABELS } from "@booktalk/shared";
import { prisma } from "../prisma.js";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getOptionalUserId(request: any): Promise<string | null> {
  try {
    await request.jwtVerify();
    return (request.user as { userId: string }).userId;
  } catch {
    return null;
  }
}

export default async function feedbackRoutes(app: FastifyInstance) {
  // POST /feedback — store feedback and email the site owner. Open to everyone
  // (bug reports from logged-out users are valuable); rate-limited.
  app.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      try {
        const data = feedbackSchema.parse(request.body);
        const userId = await getOptionalUserId(request);
        const userAgent = request.headers["user-agent"] ?? null;

        // Persist first so feedback isn't lost even if the email send fails.
        const feedback = await prisma.feedback.create({
          data: {
            userId: userId ?? null,
            type: data.type,
            message: data.message,
            url: data.url ?? null,
            userAgent,
          },
        });

        let who = "Anonymous";
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true },
          });
          if (user) who = `@${user.username} (${user.email})`;
        }

        const to = process.env.FEEDBACK_EMAIL ?? process.env.FROM_EMAIL;
        if (to && process.env.FROM_EMAIL) {
          // Non-blocking: we already stored the row.
          resend.emails
            .send({
              from: process.env.FROM_EMAIL,
              to,
              subject: `[BookTalk] ${FEEDBACK_TYPE_LABELS[data.type]} feedback`,
              html: `
                <p><strong>Type:</strong> ${FEEDBACK_TYPE_LABELS[data.type]}</p>
                <p><strong>From:</strong> ${escapeHtml(who)}</p>
                ${data.url ? `<p><strong>Page:</strong> ${escapeHtml(data.url)}</p>` : ""}
                <p><strong>Message:</strong></p>
                <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
                <hr/>
                <p style="color:#888;font-size:12px">${escapeHtml(userAgent ?? "")}</p>
              `,
            })
            .catch((err) => app.log.error(err, "Feedback email failed"));
        }

        return reply.status(201).send({ id: feedback.id });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ errors: err.issues });
        }
        console.error(err);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}

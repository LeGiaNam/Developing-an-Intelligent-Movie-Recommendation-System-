import { z } from "zod";
import { ok } from "../../common/utils/response.js";
import { RecommendationEvent } from "./recommendation-event.model.js";

const eventSchema = z.object({
  profileId: z.string().optional().nullable(),
  movieId: z.string().min(1),
  eventType: z.enum(["impression", "click", "play"]),
  variant: z.enum(["control", "recommendation"]).default("recommendation"),
  source: z.string().default("home_popup"),
  sessionId: z.string().optional().default(""),
  score: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export async function recommendationEventRoutes(app) {
  app.post("/", async (request, reply) => {
    const input = eventSchema.parse(request.body);
    const event = await RecommendationEvent.create(input);
    reply.code(201);
    return ok({ id: event._id });
  });

  app.get("/summary", async () => {
    const summary = await RecommendationEvent.aggregate([
      {
        $group: {
          _id: { variant: "$variant", source: "$source", eventType: "$eventType" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.variant": 1, "_id.source": 1, "_id.eventType": 1 } },
    ]);
    return ok(summary);
  });
}

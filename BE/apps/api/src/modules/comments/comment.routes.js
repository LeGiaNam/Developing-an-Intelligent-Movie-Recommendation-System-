import { z } from "zod";
import { authenticate } from "../../common/middleware/auth.js";
import { AppError } from "../../common/errors/AppError.js";
import { ok } from "../../common/utils/response.js";
import { Comment } from "./comment.model.js";
import { assertProfileOwnership } from "../../common/utils/assertProfileOwnership.js";

export async function commentRoutes(app) {
  app.get("/movies/:movieId/comments", async (request) => {
    const limit = Math.min(Number(request.query.limit ?? 10), 10);
    const comments = await Comment.find({ movieId: request.params.movieId, parentCommentId: null, isDeleted: false })
      .populate("profileId", "name avatarUrl isKids")
      .sort({ createdAt: -1 })
      .limit(limit);
    return ok(comments);
  });

  app.post("/movies/:movieId/comments", { preHandler: authenticate }, async (request, reply) => {
    const input = z.object({ profileId: z.string(), content: z.string().min(1).max(500) }).parse(request.body);
    await assertProfileOwnership(input.profileId, request.user.sub);
    const latest = await Comment.findOne({ profileId: input.profileId }).sort({ createdAt: -1 });
    if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
      throw new AppError(429, "COMMENT_RATE_LIMIT", "Mỗi profile chỉ được bình luận 1 lần/phút");
    }

    const comment = await Comment.create({ movieId: request.params.movieId, ...input });
    await comment.populate("profileId", "name avatarUrl isKids");
    reply.code(201);
    return ok(comment);
  });

  app.post("/comments/:commentId/replies", { preHandler: authenticate }, async (request, reply) => {
    const input = z.object({ profileId: z.string(), movieId: z.string(), content: z.string().min(1).max(500) }).parse(request.body);
    await assertProfileOwnership(input.profileId, request.user.sub);
    const replyComment = await Comment.create({ ...input, parentCommentId: request.params.commentId });
    await replyComment.populate("profileId", "name avatarUrl isKids");
    reply.code(201);
    return ok(replyComment);
  });
}

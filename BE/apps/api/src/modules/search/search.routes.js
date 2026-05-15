import { ok } from "../../common/utils/response.js";
import { Movie } from "../movies/movie.model.js";
import { normalizeText } from "../../common/utils/normalizeText.js";

export async function searchRoutes(app) {
  app.get("/suggest", async (request) => {
    const q = String(request.query.q ?? "").trim();
    if (q.length < 3) {
      return ok([]);
    }

    const normalizedQuery = normalizeText(q);
    let movies = await Movie.find(
      { $text: { $search: q }, isDeleted: false },
      { score: { $meta: "textScore" }, title: 1, posterUrl: 1, releaseYear: 1 }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    if (movies.length === 0) {
      movies = await Movie.find({
        isDeleted: false,
        normalizedTitle: { $regex: normalizedQuery, $options: "i" },
      })
        .select("title posterUrl releaseYear")
        .limit(5);
    }

    return ok(movies);
  });

  app.get("/movies", async (request) => {
    const { q, genre, year, country, minRating } = request.query;
    const filter = { isDeleted: false };
    if (q) filter.$text = { $search: String(q) };
    if (genre) filter.genres = genre;
    if (year) filter.releaseYear = Number(year);
    if (country) filter.countries = country;
    if (minRating) filter.averageRating = { $gte: Number(minRating) };

    let movies = await Movie.find(filter).limit(24);
    if (q && movies.length === 0) {
      const fallbackFilter = { ...filter };
      delete fallbackFilter.$text;
      fallbackFilter.normalizedTitle = { $regex: normalizeText(String(q)), $options: "i" };
      movies = await Movie.find(fallbackFilter).limit(24);
    }
    return ok(movies);
  });
}

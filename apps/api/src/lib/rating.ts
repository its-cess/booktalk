import { prisma } from "../prisma.js";

// Ratings are stored as half-stars (0–10 integer) and exposed over the API as
// a decimal 0–5. These helpers convert between the two representations.

export function halfStarsToRating(halfStars: number | null): number | null {
  return halfStars == null ? null : halfStars / 2;
}

export function ratingToHalfStars(rating: number | null | undefined): number | null {
  return rating == null ? null : Math.round(rating * 2);
}

/** Minimum number of (non-DNF) ratings before a community average is shown. */
export const MIN_RATINGS_FOR_AVERAGE = 3;

export interface PostRatingShape {
  rating: number | null;
  dnf: boolean;
}

interface RatingBearingPost {
  authorId: string;
  bookId: string | null;
  showsRating: boolean;
}

const EMPTY_RATING: PostRatingShape = { rating: null, dnf: false };

/**
 * Batch-load the authors' current book ratings for a set of posts. A post
 * displays its author's live rating of the linked book (only when showsRating
 * is set). Returns a map keyed by `${userId}:${bookId}`.
 */
export async function loadAuthorBookRatings(
  posts: RatingBearingPost[]
): Promise<Map<string, PostRatingShape>> {
  const map = new Map<string, PostRatingShape>();
  const wanted = posts.filter((p) => p.showsRating && p.bookId);
  if (wanted.length === 0) return map;

  const rows = await prisma.bookRating.findMany({
    where: { OR: wanted.map((p) => ({ userId: p.authorId, bookId: p.bookId! })) },
    select: { userId: true, bookId: true, halfStars: true, dnf: true },
  });
  for (const r of rows) {
    map.set(`${r.userId}:${r.bookId}`, { rating: halfStarsToRating(r.halfStars), dnf: r.dnf });
  }
  return map;
}

/** Resolve the rating a post should display from a preloaded ratings map. */
export function postRatingFor(
  post: RatingBearingPost,
  map: Map<string, PostRatingShape>
): PostRatingShape {
  if (!post.showsRating || !post.bookId) return EMPTY_RATING;
  return map.get(`${post.authorId}:${post.bookId}`) ?? EMPTY_RATING;
}

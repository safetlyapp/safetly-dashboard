import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ReviewsAdmin } from "@/components/dashboard/reviews-admin";
import { db } from "@/db";
import { admins, reviews } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Manage customer reviews",
};

export default async function ReviewsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [admin] = await db()
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);
  if (!admin) redirect("/login");

  const reviewRows = await db()
    .select()
    .from(reviews)
    .orderBy(asc(reviews.displayOrder), asc(reviews.reviewDate));

  return (
    <ReviewsAdmin
      initialReviews={reviewRows.map((review) => ({
        ...review,
        reviewDate: review.reviewDate.toISOString(),
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      }))}
    />
  );
}

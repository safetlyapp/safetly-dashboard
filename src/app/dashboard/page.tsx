import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Administrator dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [admin] = await db()
    .select({
      id: admins.id,
      email: admins.email,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .where(eq(admins.id, session.sub))
    .limit(1);

  if (!admin) {
    redirect("/login");
  }

  return (
    <AdminDashboard
      id={admin.id}
      email={admin.email}
      createdAt={admin.createdAt.toISOString()}
    />
  );
}

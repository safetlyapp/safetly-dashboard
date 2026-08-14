import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
} as const;

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const pricingPlans = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: text("plan_id").notNull().unique(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  per: text("per").notNull(),
  billedNote: text("billed_note").notNull(),
  strikeNote: text("strike_note"),
  cta: text("cta").notNull(),
  accentColor: text("accent_color").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  features: jsonb("features")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  ...timestamps,
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").notNull().default(5),
  reviewDate: timestamp("review_date", { withTimezone: true }).notNull(),
  initials: text("initials").notNull(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  isFeatured: boolean("is_featured").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
});

export const faqCategories = pgTable("faq_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  ...timestamps,
});

export const faqItems = pgTable("faq_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => faqCategories.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  ...timestamps,
});

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type FaqCategory = typeof faqCategories.$inferSelect;
export type NewFaqCategory = typeof faqCategories.$inferInsert;
export type FaqItem = typeof faqItems.$inferSelect;
export type NewFaqItem = typeof faqItems.$inferInsert;

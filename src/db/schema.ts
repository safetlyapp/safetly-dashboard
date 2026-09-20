import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  numeric,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
} as const;

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'approved',
  'rejected',
]);

export const couponDiscountTypeEnum = pgEnum('coupon_discount_type', [
  'percentage',
  'flat',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'approved',
  'pending',
  'held_for_review',
  'manual_review',
  'rejected',
  'reversed',
  'already_claimed',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
]);

export const parents = pgTable('parents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id')
    .notNull()
    .references(() => parents.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  expireDate: timestamp('expire_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  packageName: text('package_name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  startsAt: timestamp('starts_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: text('plan_id').notNull().unique(),
  name: text('name').notNull(),
  price: text('price').notNull(),
  per: text('per').notNull(),
  billedNote: text('billed_note').notNull(),
  strikeNote: text('strike_note'),
  cta: text('cta').notNull(),
  accentColor: text('accent_color').notNull(),
  isPopular: boolean('is_popular').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  features: jsonb('features')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  ...timestamps,
});

export const seoSettings = pgTable('seo_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  homepageTitle: text('homepage_title').notNull(),
  homepageDescription: text('homepage_description').notNull(),
  keywords: jsonb('keywords')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  ogImage: text('og_image'),
  twitterTitle: text('twitter_title'),
  canonicalSiteUrl: text('canonical_site_url'),
  tutorialVideoUrl: text('tutorial_video_url'),
  ...timestamps,
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull().default(5),
  reviewDate: timestamp('review_date', { withTimezone: true }).notNull(),
  initials: text('initials').notNull(),
  status: reviewStatusEnum('status').notNull().default('pending'),
  isFeatured: boolean('is_featured').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
});

export const faqCategories = pgTable('faq_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull().unique(),
  displayOrder: integer('display_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  ...timestamps,
});

export const faqItems = pgTable('faq_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => faqCategories.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  ...timestamps,
});

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  discountType: couponDiscountTypeEnum('discount_type').notNull(),
  discountValue: numeric('discount_value', {
    precision: 12,
    scale: 2,
  }).notNull(),
  maxUsageTotal: integer('max_usage_total'),
  usageCount: integer('usage_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const couponUsages = pgTable(
  'coupon_usages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCouponUnique: unique('coupon_usages_user_coupon_unique').on(
      table.userId,
      table.couponId
    ),
  })
);

export const paymentRecords = pgTable('payment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: text('order_id').notNull().unique(),
  trxId: text('trx_id').notNull(),
  planId: text('plan_id'),
  packageName: text('package_name'),
  customerEmail: text('customer_email').notNull(),
  senderPhoneNumber: text('sender_phone_number').notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
  submittedAmount: numeric('submitted_amount', {
    precision: 12,
    scale: 2,
  }).notNull(),
  verifiedAmount: numeric('verified_amount', { precision: 12, scale: 2 }),
  status: paymentStatusEnum('status').notNull(),
  payconfirmStatus: text('payconfirm_status'),
  payconfirmReason: text('payconfirm_reason'),
  payconfirmResponse: jsonb('payconfirm_response'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

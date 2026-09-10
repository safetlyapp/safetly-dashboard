ALTER TABLE "payment_records" ADD COLUMN "plan_id" text;--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN "package_name" text;--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN "original_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_records" ADD COLUMN "discount_amount" numeric(12, 2);
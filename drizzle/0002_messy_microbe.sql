CREATE TYPE "public"."payment_status" AS ENUM('approved', 'pending', 'held_for_review', 'manual_review', 'rejected', 'reversed', 'already_claimed');--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"trx_id" text NOT NULL,
	"customer_email" text NOT NULL,
	"sender_phone_number" text NOT NULL,
	"submitted_amount" numeric(12, 2) NOT NULL,
	"verified_amount" numeric(12, 2),
	"status" "payment_status" NOT NULL,
	"payconfirm_status" text,
	"payconfirm_reason" text,
	"payconfirm_response" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_records_order_id_unique" UNIQUE("order_id")
);

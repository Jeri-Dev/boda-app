CREATE TABLE "timeline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"time" text,
	"event" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

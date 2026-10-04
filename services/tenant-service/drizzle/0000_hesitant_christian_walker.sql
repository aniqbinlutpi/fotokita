CREATE TABLE "tenant_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"wedding_id" text NOT NULL,
	"wedding_slug" text NOT NULL,
	"wedding_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_accounts_username_unique" UNIQUE("username"),
	CONSTRAINT "tenant_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tenant_customizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" text NOT NULL,
	"partner1" text,
	"partner2" text,
	"wedding_date" text,
	"eyebrow" text DEFAULT '- WEDDING ARCHIVE -' NOT NULL,
	"tagline" text DEFAULT 'Every candid smile, every heartfelt celebration — preserved for a lifetime.' NOT NULL,
	"theme_palette" text DEFAULT 'warmGold' NOT NULL,
	"fireworks_enabled" boolean DEFAULT true NOT NULL,
	"orb_style" text DEFAULT 'warmGoldChocolate' NOT NULL,
	"font_preset" text DEFAULT 'editorial-serif' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_customizations_wedding_id_unique" UNIQUE("wedding_id")
);

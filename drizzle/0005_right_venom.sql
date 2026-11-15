CREATE TABLE "document_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_contents_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
ALTER TABLE "document_contents" ADD CONSTRAINT "document_contents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
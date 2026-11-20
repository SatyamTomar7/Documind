import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text
  ,customType
  ,index
} from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  tokenHash: varchar("token_hash", { length: 255 })
    .notNull()
    .unique(),

  expiresAt: timestamp("expires_at").notNull(),

  revokedAt: timestamp("revoked_at"),

  replacedByTokenHash: varchar("replaced_by_token_hash", {
    length: 255,
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  originalName: varchar("original_name", { length: 255 }).notNull(),

  storageKey: varchar("storage_key", { length: 500 }).notNull(),

  mimeType: varchar("mime_type", { length: 100 }).notNull(),

  size: integer("size").notNull(),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("pending"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const documentContents = pgTable("document_contents", {
  id: serial("id").primaryKey(),

  documentId: integer("document_id")
    .notNull()
    .unique()
    .references(() => documents.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
const vector = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(1536)";
  },

  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },

  fromDriver(value: string) {
    return value
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
});
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: serial("id").primaryKey(),

    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    chunkIndex: integer("chunk_index").notNull(),

    embedding: vector("embedding", { dimensions: 1536 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),

  role: varchar("role", { length: 20 }).notNull(),

  content: text("content").notNull(),
  status: varchar("status", { length: 20 })
  .notNull()
  .default("completed"),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
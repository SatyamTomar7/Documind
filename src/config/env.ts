import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

try {
  const parsedDatabaseUrl = new URL(databaseUrl);

  if (
    parsedDatabaseUrl.protocol !== "postgres:" &&
    parsedDatabaseUrl.protocol !== "postgresql:"
  ) {
    throw new Error();
  }
} catch {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
}

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required");
}
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("OPENAI_API_KEY is required");
}
const groqApiKey=process.env.GROQ_API_KEY
if (!groqApiKey) {
  throw new Error("GROQ_API_KEY is required");
}
const cohereapikey=process.env.COHERE_API_KEY;
if(!cohereapikey){
throw new Error("COHeRE_API_KEY is required");
}
const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const documentChunkSize =
  process.env.DOCUMENT_CHUNK_SIZE === undefined
    ? 1000
    : Number(process.env.DOCUMENT_CHUNK_SIZE);
const documentChunkOverlap =
  process.env.DOCUMENT_CHUNK_OVERLAP === undefined
    ? 200
    : Number(process.env.DOCUMENT_CHUNK_OVERLAP);
const llmTimeoutMs =
  process.env.LLM_TIMEOUT_MS === undefined
    ? 20_000
    : Number(process.env.LLM_TIMEOUT_MS);

if (
  !Number.isInteger(documentChunkSize) ||
  documentChunkSize <= 0 ||
  !Number.isInteger(documentChunkOverlap) ||
  documentChunkOverlap < 0 ||
  documentChunkOverlap >= documentChunkSize ||
  !Number.isInteger(llmTimeoutMs) ||
  llmTimeoutMs <= 0
) {
  throw new Error(
    "Document chunk settings and LLM_TIMEOUT_MS must be valid positive values",
  );
}

const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl,
  jwtSecret,
  gemini_api_key: geminiApiKey,
  openai_api_key:openaiApiKey,
  groq_api_key:groqApiKey,
  cohere_api_key: cohereapikey,
  corsOrigins,
  documentChunkSize,
  documentChunkOverlap,
  llmTimeoutMs,
};

export default env;
import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
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

if (
  !Number.isInteger(documentChunkSize) ||
  documentChunkSize <= 0 ||
  !Number.isInteger(documentChunkOverlap) ||
  documentChunkOverlap < 0 ||
  documentChunkOverlap >= documentChunkSize
) {
  throw new Error(
    "DOCUMENT_CHUNK_SIZE must be a positive integer and DOCUMENT_CHUNK_OVERLAP must be between 0 and chunk size",
  );
}

const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret,
  gemini_api_key: geminiApiKey,
  openai_api_key:openaiApiKey,
  groq_api_key:groqApiKey,
  cohere_api_key: cohereapikey,
  corsOrigins,
  documentChunkSize,
  documentChunkOverlap,
};

export default env;
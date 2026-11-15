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
const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret,
  gemini_api_key: geminiApiKey,
  openai_api_key:openaiApiKey,
  groq_api_key:groqApiKey,
  cohere_api_key: cohereapikey,
};

export default env;
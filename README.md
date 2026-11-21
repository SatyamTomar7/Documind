# DocuMind Backend

DocuMind is an Express and PostgreSQL API for uploading documents, extracting
their text, generating embeddings, and asking grounded questions over them.

## Requirements

- Node.js 20+
- PostgreSQL with the `pgvector` extension
- API keys for Gemini, OpenAI, Groq, and Cohere

## Setup

```powershell
cd backend
npm install
New-Item .env
```

Set these values in `.env`:

```text
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/documind
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
COHERE_API_KEY=
CORS_ORIGIN=http://localhost:5173
LLM_TIMEOUT_MS=20000
DOCUMENT_CHUNK_SIZE=1000
DOCUMENT_CHUNK_OVERLAP=200
```

Do not commit `.env` or API keys.

## Database

Run migrations from the `backend` directory:

```powershell
npm run db:migrate
```

The migration chain enables `pgvector` and creates the application tables and
indexes.

## Running

```powershell
npx tsx src/server.ts
```

The API listens on `http://localhost:3000` by default.

## Tests and type-checking

```powershell
npm test
npm run typecheck
```

Tests run without external LLM requests or database access.

## Main endpoints

All protected endpoints require:

```text
Authorization: Bearer <access-token>
```

- `POST /users` — register a user
- `POST /auth/login` — authenticate and receive access/refresh tokens
- `POST /auth/refresh` — rotate a refresh token
- `POST /documents` — upload a PDF, TXT, or DOCX file
- `GET /fetchdoc?page=1&limit=20` — list paginated documents
- `POST /documents/:id/process` — process a document
- `POST /documents/:id/retry` — retry failed processing
- `POST /documents/:id/stream` — stream a document question over SSE
- `POST /conversations` — create a document conversation
- `POST /conversations/:id/messages/ask` — ask a grounded question

## Security defaults

The API enables Helmet, configurable CORS, login rate limiting, account
lockout after repeated failures, JWT payload validation, upload content
validation, and bounded LLM/document-processing timeouts.

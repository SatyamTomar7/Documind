import { rerankChunks } from "../src/services/reranker.services";

const chunks = [
  {
    chunkId: 61,
    chunkIndex: 4,
    content:
      "Implemented JWT authentication, RBAC middleware, department-wise access control, and OTP-based email verification.",
    distance: 0.36,
  },
  {
    chunkId: 62,
    chunkIndex: 5,
    content:
      "Built a distributed system using Redis-backed BullMQ queues with retry logic and failure handling.",
    distance: 0.38,
  },
  {
    chunkId: 60,
    chunkIndex: 3,
    content:
      "Gathered requirements and feedback from university stakeholders and documented reported issues.",
    distance: 0.39,
  },
];

async function main() {
  const question =
       "What are the main features of this system?"

  const results = await rerankChunks(
    question,
    chunks,
    2
  );

  console.dir(results, { depth: null });
}

main().catch((error) => {
  console.error("❌ Error:", error?.message ?? error);
  process.exit(1);
});
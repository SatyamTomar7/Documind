import { answerDocumentQuestion } from "../src/services/rag.services";

async function main() {
const documentId = 4;
const userId = 1; // Replace with the actual document owner's user ID

const result = await answerDocumentQuestion(
  documentId,
  "What is the recipe for making pizza?",
  userId,
);

  console.dir(result, { depth: null });
}

main().catch((error) => {
  console.error("❌ Error:", error?.message ?? error);
  console.error(error);
  process.exit(1);
});
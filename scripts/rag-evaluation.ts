import { answerDocumentQuestion } from "../src/services/rag.services";

const documentId = 4;

const userId = 1; 

const testCases = [

  {
    question: "What are the main features of this system?",
    expected: "relevant",
  },

  {
    question: "What is the recipe for making pizza?",
    expected: "irrelevant",
  },
  {
    question: "Which database is used by AmiFound?",
    expected: "relevant",
  },

  {
    question: "What cloud platforms were used for deployment?",
    expected: "relevant",
  },
];

const runEvaluation = async () => {
  for (const testCase of testCases) {
    try {
const result = await answerDocumentQuestion(
  documentId,
  testCase.question,
  userId,
);
const hasCitations = result.citations.length > 0;

const passed =
  testCase.expected === "relevant"
    ? hasCitations && result.grounded
    : !hasCitations && !result.grounded;

console.log("Expected:", testCase.expected);
console.log("Passed:", passed);
      console.log("Question:", testCase.question);
      console.log("Expected:", testCase.expected);
      console.log("Candidate Count:", result.candidateCount);
      console.log("Top Distance:", result.topDistance);
      console.log("Reranked Count:", result.rerankedCount);
      console.log("Has Citations:", result.citations.length > 0);
      console.log("Answer:", result.answer);
      console.log("Grounded:", result.grounded);
      console.log("--------------------------------");
    } catch (error) {
      console.error(
        "Evaluation failed:",
        testCase.question
      );
      console.error(error);
      console.log("--------------------------------");
    }
  }
};

runEvaluation();
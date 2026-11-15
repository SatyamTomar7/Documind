type Citation = {
  source: number;
  chunkId: number;
  chunkIndex: number;
  content: string;
  distance: number;
};

type GroundingResult = {
  grounded: boolean;
  citations: Citation[];
};

export const validateCitationGrounding = (
  citations: Citation[],
  answer: string
): GroundingResult => {
  if (!citations.length) {
    return {
      grounded: false,
      citations: [],
    };
  }

  const answerText = answer.trim();

  if (!answerText) {
    return {
      grounded: false,
      citations: [],
    };
  }

  return {
    grounded: true,
    citations,
  };
};
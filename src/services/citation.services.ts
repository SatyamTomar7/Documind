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
  if (
    !citations.length ||
    citations.some(
      (citation) =>
        !Number.isInteger(citation.source) ||
        citation.source < 1 ||
        !Number.isInteger(citation.chunkId) ||
        !Number.isInteger(citation.chunkIndex) ||
        !Number.isFinite(citation.distance) ||
        citation.distance < 0 ||
        !citation.content.trim(),
    )
  ) {
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

  const answerTokens = new Set(
    answerText.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [],
  );
  const citedTokens = new Set(
    citations
      .flatMap((citation) => citation.content.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []),
  );
  const sharedTokenCount = [...answerTokens].filter((token) =>
    citedTokens.has(token),
  ).length;

  if (sharedTokenCount < 2) {
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
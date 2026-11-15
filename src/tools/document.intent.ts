export const isDocumentCountQuestion = (question: string): boolean => {
  return /\b(how many|number of|count of)\b.*\b(documents?|docs?|files?|pdfs?)\b/i.test(
    question,
  );
};

export const isDocumentListQuestion = (question: string): boolean => {
  const normalizedQuestion = question.trim();

  return (
    /\b(list|show|display|give me|which|what)\b.*\b(documents?|docs?|files?|pdfs?)\b/i.test(
      normalizedQuestion,
    ) &&
    /\b(uploaded|have|my|all|available)\b/i.test(normalizedQuestion)
  );
};

const hasDocumentReference = (question: string): boolean =>
  /\b(document|doc|file|pdf)\b/i.test(question);

export const getDocumentIdFromQuestion = (
  question: string,
): number | null => {
  const match = question.match(
    /\b(?:document|doc|file|pdf)(?:\s+(?:id|number|no\.?))?\s*#?\s*(\d+)\b/i,
  );

  if (!match?.[1]) {
    return null;
  }

  const documentId = Number(match[1]);
  return Number.isSafeInteger(documentId) && documentId > 0
    ? documentId
    : null;
};

export const isDocumentStatusQuestion = (question: string): boolean =>
  hasDocumentReference(question) &&
  /\b(status|processing|processed|pending|complete|completed|failed|ready)\b/i.test(
    question,
  );

export const isDocumentDetailsQuestion = (question: string): boolean =>
  hasDocumentReference(question) &&
  /\b(details?|metadata|information|info|properties)\b/i.test(question);
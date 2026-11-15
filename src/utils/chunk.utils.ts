export const chunkText = (
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
) => {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error(
      "overlap must be greater than or equal to 0 and less than chunkSize"
    );
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      segments.push(paragraph);
      continue;
    }

    const sentences = paragraph
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      if (sentence.length <= chunkSize) {
        segments.push(sentence);
        continue;
      }

      for (let start = 0; start < sentence.length; start += chunkSize) {
        segments.push(sentence.slice(start, start + chunkSize));
      }
    }
  }

const chunks: string[] = [];
let currentChunk = "";

for (const segment of segments) {
  if (!currentChunk) {
    currentChunk = segment;
    continue;
  }

  const candidate = `${currentChunk} ${segment}`;

  if (candidate.length <= chunkSize) {
    currentChunk = candidate;
    continue;
  }

  chunks.push(currentChunk.trim());

  const overlapText = currentChunk.slice(-overlap).trim();

  const availableSpace = chunkSize - overlapText.length - 1;

  if (segment.length <= availableSpace) {
    currentChunk = `${overlapText} ${segment}`.trim();
  } else {
    currentChunk = segment;
  }
}

if (currentChunk) {
  chunks.push(currentChunk.trim());
}

return chunks;
};
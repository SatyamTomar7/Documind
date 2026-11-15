type RetrievedChunk = {
  chunkId: number;
  chunkIndex: number;
  content: string;
  distance: number;
};

export const buildContext = (
  chunks: RetrievedChunk[]
): string => {
  return chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}]\n${chunk.content}`
    )
    .join("\n\n");
};
// export const normalizeText = (text: string) => {
//   return text
//     .replace(/\r\n/g, "\n")
//     .replace(/\r/g, "\n")
//     .replace(/[ \t]+/g, " ")
//     .replace(/\n{3,}/g, "\n\n")
//     .trim();
// };
export const normalizeText = (text: string): string => {
  return text
    // Normalize line endings
    .replace(/\r\n?/g, "\n")

    // Remove null/control characters while preserving
    // tabs, newlines, and normal printable characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")

    // Normalize non-breaking spaces
    .replace(/\u00A0/g, " ")

    // Remove trailing whitespace from each line
    .replace(/[ \t]+$/gm, "")

    // Remove excessive spaces/tabs inside text
    .replace(/[ \t]{2,}/g, " ")

    // Collapse excessive blank lines
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")

    // Remove leading/trailing whitespace
    .trim();
};
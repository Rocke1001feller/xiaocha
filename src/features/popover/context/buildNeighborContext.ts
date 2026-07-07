const SIDE_CONTEXT_LIMIT = 100;

function normalizeSegment(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function takeLeadingChars(value: string, maxChars: number) {
  return value.length <= maxChars ? value : value.slice(0, maxChars);
}

function takeTrailingChars(value: string, maxChars: number) {
  return value.length <= maxChars ? value : value.slice(-maxChars);
}

export function buildNeighborContext(
  previousText: string | null | undefined,
  currentText: string | null | undefined,
  nextText: string | null | undefined,
) {
  const context = [
    takeTrailingChars(normalizeSegment(previousText), SIDE_CONTEXT_LIMIT),
    normalizeSegment(currentText),
    takeLeadingChars(normalizeSegment(nextText), SIDE_CONTEXT_LIMIT),
  ]
    .filter(Boolean)
    .join('\n\n');

  return context ? `${context}\n` : '';
}
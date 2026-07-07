import { describe, expect, it } from 'vitest';
import { buildNeighborContext } from '../../src/features/popover/context/buildNeighborContext';

describe('buildNeighborContext', () => {
  it('keeps the current block and trims sibling context to 100 chars per side', () => {
    const previous = `prev-${'a'.repeat(120)}`;
    const current = 'current paragraph';
    const next = `${'b'.repeat(120)}-next`;

    expect(buildNeighborContext(previous, current, next)).toBe(
      `${previous.slice(-100)}\n\n${current}\n\n${next.slice(0, 100)}\n`,
    );
  });

  it('omits empty siblings and still appends a trailing newline', () => {
    expect(buildNeighborContext('', 'current paragraph', null)).toBe('current paragraph\n');
  });
});
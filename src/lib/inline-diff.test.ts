import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInlineDiffer, type InlineDiff } from './inline-diff';

function reconstructed(result: InlineDiff) {
  return [
    result.changes.filter((part) => !part.added).map((part) => part.value).join(''),
    result.changes.filter((part) => !part.removed).map((part) => part.value).join(''),
  ];
}

afterEach(() => vi.restoreAllMocks());

describe('inline highlighting', () => {
  it.each([
    ['a  b', 'a b'],
    ['\t  original\t', '  original '],
    ['你好  world\t🙂', '你好 world 🙂'],
  ])('preserves whitespace on both sides in word mode: %j', (left, right) => {
    const result = createInlineDiffer('word')(left, right);
    expect(result.limited).toBe(false);
    expect(reconstructed(result)).toEqual([left, right]);
    expect(result.changes.some((part) => part.added || part.removed)).toBe(true);
  });

  it('retains precise character highlighting for ordinary edits', () => {
    const result = createInlineDiffer()('const a = 1;', 'const a = 2;');
    expect(result.limited).toBe(false);
    expect(result.changes.filter((part) => part.removed).map((part) => part.value).join('')).toBe('1');
    expect(result.changes.filter((part) => part.added).map((part) => part.value).join('')).toBe('2');
  });

  it('shares the budget across different cells without poisoning later comparisons', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(100);
    const compare = createInlineDiffer();
    expect(compare('first apple', 'first maple').limited).toBe(false);
    const left = 'budget alpha', right = 'budget beta';
    const limited = compare(left, right);
    expect(limited.limited).toBe(true);
    expect(reconstructed(limited)).toEqual([left, right]);
    clock.mockRestore();
    expect(createInlineDiffer()(left, right).limited).toBe(false);
  });

  it('preserves all text when long or complex changes use whole-value highlighting', () => {
    for (const length of [2_000, 25_000]) {
      const left = 'a'.repeat(length), right = 'b'.repeat(length);
      const result = createInlineDiffer()(left, right);
      expect(result.limited).toBe(true);
      expect(reconstructed(result)).toEqual([left, right]);
    }
  });

  it('does not spend the budget on equal values or one-sided changes', () => {
    const compare = createInlineDiffer('character', 0);
    expect(compare('same', 'same').limited).toBe(false);
    expect(compare(undefined, 'added').limited).toBe(false);
    expect(reconstructed(compare('removed', undefined))).toEqual(['removed', '']);
  });
});

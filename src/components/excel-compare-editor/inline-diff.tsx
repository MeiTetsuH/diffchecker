'use client';

import React from 'react';
import { diffChars, type Change } from 'diff';
import styles from './styles.module.css';

type DiffSide = 'left' | 'right';

function toText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

export function renderInlineDiff(
  leftValue: unknown,
  rightValue: unknown,
  side: DiffSide,
): React.ReactNode {
  const leftText = toText(leftValue);
  const rightText = toText(rightValue);
  const parts = diffChars(leftText, rightText, { maxEditLength: 2_000 }) ?? [
    ...(leftText ? [{ value: leftText, removed: true, added: false, count: leftText.length } satisfies Change] : []),
    ...(rightText ? [{ value: rightText, removed: false, added: true, count: rightText.length } satisfies Change] : []),
  ];

  return parts.map((part, index) => {
    if (side === 'left' && part.added) return null;
    if (side === 'right' && part.removed) return null;

    if (part.removed) {
      return (
        <span key={index} className={styles.inlineRemoved}>
          {part.value}
        </span>
      );
    }
    if (part.added) {
      return (
        <span key={index} className={styles.inlineAdded}>
          {part.value}
        </span>
      );
    }
    return <span key={index}>{part.value}</span>;
  });
}

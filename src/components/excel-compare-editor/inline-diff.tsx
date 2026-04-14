'use client';

import React from 'react';
import { diffChars } from 'diff';

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
  const parts = diffChars(leftText, rightText);

  return parts.map((part, index) => {
    if (side === 'left' && part.added) return null;
    if (side === 'right' && part.removed) return null;

    if (part.removed) {
      return (
        <span
          key={index}
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            textDecoration: 'line-through',
            borderRadius: '3px',
            padding: '0 1px',
          }}
        >
          {part.value}
        </span>
      );
    }
    if (part.added) {
      return (
        <span
          key={index}
          style={{
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            borderRadius: '3px',
            padding: '0 1px',
          }}
        >
          {part.value}
        </span>
      );
    }
    return <span key={index}>{part.value}</span>;
  });
}

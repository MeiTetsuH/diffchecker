'use client';

import React from 'react';
import type { Change } from 'diff';
import styles from './styles.module.css';

type DiffSide = 'left' | 'right';

export function renderInlineDiff(
  parts: Change[],
  side: DiffSide,
): React.ReactNode {
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

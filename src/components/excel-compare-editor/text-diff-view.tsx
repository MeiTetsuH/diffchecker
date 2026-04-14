'use client';

import React, { useMemo } from 'react';

interface TextDiffViewProps {
  csvLeft: string[];
  csvRight: string[];
}

export const TextDiffView: React.FC<TextDiffViewProps> = ({ csvLeft, csvRight }) => {
  const maxLines = Math.max(csvLeft.length, csvRight.length);
  const lines = Array.from({ length: maxLines }, (_, i) => ({
    left: csvLeft[i],
    right: csvRight[i],
  }));

  const { removedCount, addedCount } = useMemo(() => {
    let added = 0;
    let removed = 0;
    lines.forEach((line) => {
      if (line.left !== line.right) {
        if (line.left !== undefined) removed++;
        if (line.right !== undefined) added++;
      }
    });
    return { removedCount: removed, addedCount: added };
  }, [lines]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '12px', height: '100%' }}>
      <div style={{ border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 0, 0, 0.05)', borderBottom: '1px solid var(--color-separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 500, color: 'var(--color-text-highlight)' }}>{removedCount} removals</span>
          <span style={{ color: 'var(--color-text-subdue)' }}>{csvLeft.length} lines</span>
        </div>
        <div style={{ fontFamily: 'var(--font-family)', overflow: 'auto', flex: 1, padding: '0.75rem' }}>
          {lines.map((line, i) => {
            const isChanged = line.left !== line.right;
            return (
              <div key={i} style={{ display: 'flex', backgroundColor: isChanged && line.left !== undefined ? 'rgba(255, 0, 0, 0.1)' : 'transparent' }}>
                <span style={{ width: '2.5rem', textAlign: 'right', paddingRight: '0.75rem', color: 'var(--color-text-subdue)', userSelect: 'none' }}>
                  {line.left !== undefined ? i + 1 : ''}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.left}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(0, 255, 0, 0.05)', borderBottom: '1px solid var(--color-separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 500, color: 'var(--color-text-highlight)' }}>{addedCount} additions</span>
          <span style={{ color: 'var(--color-text-subdue)' }}>{csvRight.length} lines</span>
        </div>
        <div style={{ fontFamily: 'var(--font-family)', overflow: 'auto', flex: 1, padding: '0.75rem' }}>
          {lines.map((line, i) => {
            const isChanged = line.left !== line.right;
            return (
              <div key={i} style={{ display: 'flex', backgroundColor: isChanged && line.right !== undefined ? 'rgba(0, 255, 0, 0.1)' : 'transparent' }}>
                <span style={{ width: '2.5rem', textAlign: 'right', paddingRight: '0.75rem', color: 'var(--color-text-subdue)', userSelect: 'none' }}>
                  {line.right !== undefined ? i + 1 : ''}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.right}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

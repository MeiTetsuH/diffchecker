'use client';

import React, { useState } from 'react';
import { diffWords, diffChars } from 'diff';

export default function TextCompareEditor() {
  const [originalText, setOriginalText] = useState('');
  const [changedText, setChangedText] = useState('');
  const [diffMode, setDiffMode] = useState('split');
  const [highlightMode, setHighlightMode] = useState('word');

  const renderDiff = (original: string, changed: string, showAdded: boolean) => {
    const diffs = highlightMode === 'word' ? diffWords(original, changed) : diffChars(original, changed);
    return diffs.map((part, idx) => {
      const style = {
        backgroundColor: part.added && showAdded ? 'rgba(0, 255, 0, 0.2)' : part.removed && !showAdded ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
        color: 'var(--color-text-highlight)',
        textDecoration: part.removed && !showAdded ? 'line-through' : 'none'
      };
      if ((part.added && !showAdded) || (part.removed && showAdded)) {
        return null;
      }
      return <span key={idx} style={style}>{part.value}</span>;
    });
  };

  const renderSplitDiff = () => {
    const originalLines = originalText.split('\n');
    const changedLines = changedText.split('\n');
    const maxLines = Math.max(originalLines.length, changedLines.length);

    const lines = Array.from({ length: maxLines }, (_, i) => ({
      original: originalLines[i] || '',
      changed: changedLines[i] || '',
      lineNumber: i + 1
    }));

    return (
      <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
        <div style={{ flex: 1, backgroundColor: 'var(--color-widget-background-highlight)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-separator)', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-separator)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-highlight)' }}>Original</span>
          </div>
          <div style={{ padding: '1rem', fontFamily: 'var(--font-family)', fontSize: '0.875rem', overflow: 'auto', maxHeight: '600px' }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'flex', padding: '0.125rem 0' }}>
                <span style={{ width: '3rem', textAlign: 'right', paddingRight: '1rem', color: 'var(--color-text-subdue)', userSelect: 'none', fontSize: '0.75rem' }}>
                  {line.lineNumber}
                </span>
                <span style={{ flex: 1 }}>{renderDiff(line.original, line.changed, false)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--color-widget-background-highlight)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-separator)', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-separator)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-highlight)' }}>Changed</span>
          </div>
          <div style={{ padding: '1rem', fontFamily: 'var(--font-family)', fontSize: '0.875rem', overflow: 'auto', maxHeight: '600px' }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'flex', padding: '0.125rem 0' }}>
                <span style={{ width: '3rem', textAlign: 'right', paddingRight: '1rem', color: 'var(--color-text-subdue)', userSelect: 'none', fontSize: '0.75rem' }}>
                  {line.lineNumber}
                </span>
                <span style={{ flex: 1 }}>{renderDiff(line.original, line.changed, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <textarea
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          style={{ width: '100%', height: '150px', padding: '0.75rem', border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--color-widget-background)', color: 'var(--color-text-highlight)', resize: 'vertical', fontFamily: 'var(--font-family)' }}
          placeholder="Original Text"
        />
        <textarea
          value={changedText}
          onChange={(e) => setChangedText(e.target.value)}
          style={{ width: '100%', height: '150px', padding: '0.75rem', border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--color-widget-background)', color: 'var(--color-text-highlight)', resize: 'vertical', fontFamily: 'var(--font-family)' }}
          placeholder="Changed Text"
        />
      </div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <select
          value={highlightMode}
          onChange={(e) => setHighlightMode(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid var(--color-separator)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--color-widget-background)', color: 'var(--color-text-highlight)' }}
        >
          <option value="word">Word</option>
          <option value="character">Character</option>
        </select>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {(originalText || changedText) && renderSplitDiff()}
      </div>
    </div>
  );
}
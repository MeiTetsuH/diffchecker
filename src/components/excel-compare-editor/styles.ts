/**
 * Shared inline styles for the Excel compare editor.
 * Preserves the exact same visual appearance as the original.
 */

import type { CSSProperties } from 'react';

export const commonStyles = {
  button: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--color-separator)',
    borderRadius: 'var(--border-radius)',
    backgroundColor: 'var(--color-widget-background)',
    color: 'var(--color-text-highlight)',
    cursor: 'pointer' as const,
  } satisfies CSSProperties,

  buttonDisabled: {
    cursor: 'not-allowed' as const,
    backgroundColor: 'var(--color-widget-background-highlight)',
    color: 'var(--color-text-subdue)',
  } satisfies CSSProperties,

  dropZone: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--color-separator)',
    borderRadius: 'var(--border-radius)',
    padding: '1rem',
    height: '20rem',
    textAlign: 'center' as const,
    transition: 'background-color 0.2s',
    cursor: 'pointer' as const,
    position: 'relative' as const,
  } satisfies CSSProperties,
} as const;

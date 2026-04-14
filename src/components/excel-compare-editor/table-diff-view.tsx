'use client';

import React from 'react';
import type { DiffHeader, DiffRow } from '@/types/excel-diff';

interface TableDiffViewProps {
  tableDiff: [DiffHeader, ...DiffRow[]];
}

export const TableDiffView: React.FC<TableDiffViewProps> = ({ tableDiff }) => {
  if (!tableDiff || tableDiff.length < 1) return null;

  const { headers, headersLeft, headersRight } = tableDiff[0];
  const diffRows = tableDiff.slice(1) as DiffRow[];

  const getHeaderStyle = (h: string): React.CSSProperties => {
    const onlyInLeft = headersLeft.includes(h) && !headersRight.includes(h);
    const onlyInRight = !headersLeft.includes(h) && headersRight.includes(h);
    if (onlyInLeft) return { backgroundColor: 'rgba(255, 0, 0, 0.1)', color: 'var(--color-text-highlight)' };
    if (onlyInRight) return { backgroundColor: 'rgba(0, 255, 0, 0.1)', color: 'var(--color-text-highlight)' };
    return { backgroundColor: 'var(--color-widget-background-highlight)' };
  };

  const getRowStyle = (type: string): React.CSSProperties => {
    if (type === 'added') return { backgroundColor: 'rgba(0, 255, 0, 0.05)' };
    if (type === 'removed') return { backgroundColor: 'rgba(255, 0, 0, 0.05)' };
    return {};
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', fontSize: '12px' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ position: 'sticky', top: 0 }}>
          <tr>
            <th style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', userSelect: 'none', color: 'var(--color-text-subdue)', backgroundColor: 'var(--color-widget-background-highlight)' }}>
              #
            </th>
            {headers.map((h, idx) => (
              <th key={idx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap', fontWeight: 500, ...getHeaderStyle(h) }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diffRows.map((row, idx) => (
            <tr key={idx} style={getRowStyle(row.type)}>
              <td style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', textAlign: 'right', userSelect: 'none', color: 'var(--color-text-subdue)', backgroundColor: 'var(--color-widget-background-highlight)' }}>
                {idx + 1}
              </td>
              {headers.map((h, cIdx) => {
                const lVal = row.lRow ? row.lRow[h] : undefined;
                const rVal = row.rRow ? row.rRow[h] : undefined;

                let cellContent: React.ReactNode;

                switch (row.type) {
                  case 'same':
                    cellContent = lVal !== undefined ? String(lVal) : '';
                    break;
                  case 'added':
                    cellContent = (
                      <span style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', padding: '1px 3px', borderRadius: '3px' }}>
                        {rVal !== undefined ? String(rVal) : ''}
                      </span>
                    );
                    break;
                  case 'removed':
                    cellContent = (
                      <span style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', padding: '1px 3px', borderRadius: '3px', textDecoration: 'line-through' }}>
                        {lVal !== undefined ? String(lVal) : ''}
                      </span>
                    );
                    break;
                  case 'modified':
                    if (lVal !== rVal) {
                      cellContent = (
                        <>
                          {lVal !== undefined && (
                            <span style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', padding: '1px 3px', borderRadius: '3px', textDecoration: 'line-through', marginRight: '4px' }}>
                              {String(lVal)}
                            </span>
                          )}
                          {rVal !== undefined && (
                            <span style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', padding: '1px 3px', borderRadius: '3px' }}>
                              {String(rVal)}
                            </span>
                          )}
                        </>
                      );
                    } else {
                      cellContent = lVal !== undefined ? String(lVal) : '';
                    }
                    break;
                  default:
                    cellContent = lVal !== undefined ? String(lVal) : '';
                }

                return (
                  <td key={cIdx} style={{ border: '1px solid var(--color-separator)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

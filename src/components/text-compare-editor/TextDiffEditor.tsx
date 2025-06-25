// src/components/TextDiffEditor.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { diffWords, diffLines, diffChars, Change } from 'diff';
import { Copy, Check, Download, Share2, RotateCcw, ChevronDown, X } from 'lucide-react';

interface DiffResult {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export default function TextDiffEditor() {
  const [originalText, setOriginalText] = useState('');
  const [changedText, setChangedText] = useState('');
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');
  const [highlightMode, setHighlightMode] = useState<'word' | 'character'>('word');
  const [syntaxMode, setSyntaxMode] = useState('plain');
  const [showTools, setShowTools] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedChanged, setCopiedChanged] = useState(false);
  const [savedDiffs, setSavedDiffs] = useState<Array<{id: string, name: string, original: string, changed: string, date: Date}>>([]);

  const differences = useMemo(() => {
    if (!originalText && !changedText) return [];
    
    if (highlightMode === 'word') {
      return diffWords(originalText, changedText);
    } else {
      return diffChars(originalText, changedText);
    }
  }, [originalText, changedText, highlightMode]);

  const lineDifferences = useMemo(() => {
    if (!originalText && !changedText) return [];
    return diffLines(originalText, changedText);
  }, [originalText, changedText]);

  const copyToClipboard = async (text: string, type: 'original' | 'changed') => {
    await navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedChanged(true);
      setTimeout(() => setCopiedChanged(false), 2000);
    }
  };

  const handleClear = () => {
    setOriginalText('');
    setChangedText('');
  };

  const handleSave = () => {
    const id = Date.now().toString();
    const name = `Diff ${new Date().toLocaleString()}`;
    setSavedDiffs([...savedDiffs, { id, name, original: originalText, changed: changedText, date: new Date() }]);
  };

  const handleShare = async () => {
    const diffData = {
      original: originalText,
      changed: changedText,
      mode: diffMode,
      highlight: highlightMode
    };
    const shareData = btoa(JSON.stringify(diffData));
    const url = `${window.location.origin}${window.location.pathname}?diff=${shareData}`;
    await navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  const toLowerCase = (type: 'original' | 'changed') => {
    if (type === 'original') {
      setOriginalText(originalText.toLowerCase());
    } else {
      setChangedText(changedText.toLowerCase());
    }
  };

  const sortLines = (type: 'original' | 'changed') => {
    const text = type === 'original' ? originalText : changedText;
    const sorted = text.split('\n').sort().join('\n');
    if (type === 'original') {
      setOriginalText(sorted);
    } else {
      setChangedText(sorted);
    }
  };

  const replaceLineBreaks = (type: 'original' | 'changed') => {
    if (type === 'original') {
      setOriginalText(originalText.replace(/\n/g, ' '));
    } else {
      setChangedText(changedText.replace(/\n/g, ' '));
    }
  };

  const trimWhitespace = (type: 'original' | 'changed') => {
    if (type === 'original') {
      setOriginalText(originalText.trim());
    } else {
      setChangedText(changedText.trim());
    }
  };

  const exportAsPDF = () => {
    window.print();
  };

  const exportAsExcel = () => {
    const csvContent = `Original,Changed\n"${originalText.replace(/"/g, '""')}","${changedText.replace(/"/g, '""')}"`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.csv';
    a.click();
  };

  const renderUnifiedDiff = () => {
    const renderLineWithHighlights = (line: string, lineType: 'added' | 'removed' | 'unchanged') => {
      if (lineType === 'unchanged') return <span>{line}</span>;
      
      const compareLine = lineType === 'added' 
        ? originalText.split('\n').find(l => l.includes(line.substring(0, 10))) || ''
        : changedText.split('\n').find(l => l.includes(line.substring(0, 10))) || '';
      
      if (!compareLine && lineType === 'added') return <span className="bg-green-200 text-green-900">{line}</span>;
      if (!compareLine && lineType === 'removed') return <span className="bg-red-200 text-red-900">{line}</span>;
      
      const diffs = highlightMode === 'word' ? diffWords(line, compareLine) : diffChars(line, compareLine);
      
      return (
        <span>
          {diffs.map((part, idx) => {
            if (lineType === 'removed' && part.removed) {
              return <span key={idx} className="bg-red-200 text-red-900">{part.value}</span>;
            } else if (lineType === 'added' && part.added) {
              return <span key={idx} className="bg-green-200 text-green-900">{part.value}</span>;
            } else if (!part.added && !part.removed) {
              return <span key={idx}>{part.value}</span>;
            }
            return null;
          })}
        </span>
      );
    };

    const addedCount = lineDifferences.filter(d => d.added).reduce((acc, d) => acc + d.value.split('\n').filter(l => l).length, 0);
    const removedCount = lineDifferences.filter(d => d.removed).reduce((acc, d) => acc + d.value.split('\n').filter(l => l).length, 0);

    return (
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Unified diff</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
                {removedCount} removal{removedCount !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                {addedCount} addition{addedCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              const diffText = lineDifferences.map(part => {
                const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                return part.value.split('\n').filter(l => l).map(l => prefix + l).join('\n');
              }).join('\n');
              copyToClipboard(diffText, 'original');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 font-mono text-sm overflow-auto max-h-[600px]">
          {lineDifferences.map((part, index) => {
            const lines = part.value.split('\n').filter(line => line || index === lineDifferences.length - 1);
            return lines.map((line, lineIndex) => (
              <div
                key={`${index}-${lineIndex}`}
                className={`flex ${
                  part.added ? 'bg-green-50' : part.removed ? 'bg-red-50' : ''
                }`}
              >
                <span className="w-12 text-right pr-4 text-gray-400 select-none">
                  {lineIndex + 1}
                </span>
                <span className="flex-1">
                  {part.added && <span className="text-green-600">+ </span>}
                  {part.removed && <span className="text-red-600">- </span>}
                  {!part.added && !part.removed && <span className="text-gray-400">  </span>}
                  {renderLineWithHighlights(line, part.added ? 'added' : part.removed ? 'removed' : 'unchanged')}
                </span>
              </div>
            ));
          })}
        </div>
      </div>
    );
  };

  const renderSplitDiff = () => {
    const originalLines = originalText.split('\n');
    const changedLines = changedText.split('\n');
    
    // Create a line-by-line diff to properly align lines
    const lineByLineDiff = diffLines(originalText, changedText);
    
    // Build aligned lines array
    const alignedLines: Array<{original: string | null, changed: string | null, type: 'same' | 'modified' | 'added' | 'removed'}> = [];
    
    let origIdx = 0;
    let changedIdx = 0;
    
    lineByLineDiff.forEach(part => {
      const lines = part.value.split('\n').filter(l => l !== '');
      
      if (!part.added && !part.removed) {
        // Same lines
        lines.forEach(line => {
          alignedLines.push({
            original: originalLines[origIdx++],
            changed: changedLines[changedIdx++],
            type: 'same'
          });
        });
      } else if (part.removed && !part.added) {
        // Removed lines
        lines.forEach(line => {
          alignedLines.push({
            original: originalLines[origIdx++],
            changed: null,
            type: 'removed'
          });
        });
      } else if (part.added && !part.removed) {
        // Added lines
        lines.forEach(line => {
          alignedLines.push({
            original: null,
            changed: changedLines[changedIdx++],
            type: 'added'
          });
        });
      }
    });
    
    // Check for modified lines (lines that exist in both but are different)
    const finalAlignedLines: typeof alignedLines = [];
    let i = 0;
    
    while (i < alignedLines.length) {
      const current = alignedLines[i];
      
      if (current.type === 'removed' && i + 1 < alignedLines.length && alignedLines[i + 1].type === 'added') {
        // This is likely a modified line
        finalAlignedLines.push({
          original: current.original,
          changed: alignedLines[i + 1].changed,
          type: 'modified'
        });
        i += 2;
      } else {
        finalAlignedLines.push(current);
        i++;
      }
    }
    
    const renderLineContent = (line: string | null, otherLine: string | null, side: 'original' | 'changed') => {
      if (!line) return <span className="text-gray-300">{'<empty line>'}</span>;
      if (!otherLine) {
        // Line only exists on one side
        if (side === 'original') {
          return <span className="bg-red-100 text-red-900">{line}</span>;
        } else {
          return <span className="bg-green-100 text-green-900">{line}</span>;
        }
      }
      
      // Compare the two lines
      const diffs = highlightMode === 'word' ? diffWords(line, otherLine) : diffChars(line, otherLine);
      
      return (
        <span>
          {diffs.map((part, idx) => {
            if (side === 'original') {
              if (part.removed) {
                return <span key={idx} className="bg-red-200 text-red-900 font-semibold">{part.value}</span>;
              } else if (!part.added) {
                return <span key={idx}>{part.value}</span>;
              }
              return null;
            } else {
              if (part.added) {
                return <span key={idx} className="bg-green-200 text-green-900 font-semibold">{part.value}</span>;
              } else if (!part.removed) {
                return <span key={idx}>{part.value}</span>;
              }
              return null;
            }
          })}
        </span>
      );
    };

    return (
      <div className="flex gap-4 flex-1">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-700">Original text</span>
            <button 
              onClick={() => copyToClipboard(originalText, 'original')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 font-mono text-sm overflow-auto max-h-[600px]">
            {finalAlignedLines.map((line, index) => (
              <div key={index} className={`flex ${line.type === 'removed' ? 'bg-red-50' : line.type === 'modified' ? 'bg-orange-50' : ''}`}>
                <span className="w-12 text-right pr-4 text-gray-400 select-none">
                  {line.original !== null ? index + 1 : ''}
                </span>
                <span className="flex-1">
                  {line.type === 'modified' 
                    ? renderLineContent(line.original, line.changed, 'original')
                    : line.original || <span className="text-gray-300">&nbsp;</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
            <span className="text-sm font-medium text-gray-700">Changed text</span>
            <button 
              onClick={() => copyToClipboard(changedText, 'changed')}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 font-mono text-sm overflow-auto max-h-[600px]">
            {finalAlignedLines.map((line, index) => (
              <div key={index} className={`flex ${line.type === 'added' ? 'bg-green-50' : line.type === 'modified' ? 'bg-orange-50' : ''}`}>
                <span className="w-12 text-right pr-4 text-gray-400 select-none">
                  {line.changed !== null ? index + 1 : ''}
                </span>
                <span className="flex-1">
                  {line.type === 'modified' 
                    ? renderLineContent(line.changed, line.original, 'changed')
                    : line.changed || <span className="text-gray-300">&nbsp;</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Diff Editor</h1>
          <p className="text-gray-600">Compare and find differences between two text files</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Original Text</label>
                <button
                  onClick={() => copyToClipboard(originalText, 'original')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copiedOriginal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedOriginal ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Changed Text</label>
                <button
                  onClick={() => copyToClipboard(changedText, 'changed')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copiedChanged ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedChanged ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={changedText}
                onChange={(e) => setChangedText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Highlight:</label>
                <select
                  value={highlightMode}
                  onChange={(e) => setHighlightMode(e.target.value as 'word' | 'character')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="word">Word</option>
                  <option value="character">Character</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">View:</label>
                <select
                  value={diffMode}
                  onChange={(e) => setDiffMode(e.target.value as 'unified' | 'split')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unified">Unified</option>
                  <option value="split">Split</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
              >
                Save
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {showTools && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Text Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => toLowerCase('original')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  To lowercase (Original)
                </button>
                <button
                  onClick={() => toLowerCase('changed')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  To lowercase (Changed)
                </button>
                <button
                  onClick={() => sortLines('original')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Sort lines (Original)
                </button>
                <button
                  onClick={() => sortLines('changed')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Sort lines (Changed)
                </button>
                <button
                  onClick={() => replaceLineBreaks('original')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Replace breaks (Original)
                </button>
                <button
                  onClick={() => replaceLineBreaks('changed')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Replace breaks (Changed)
                </button>
                <button
                  onClick={() => trimWhitespace('original')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Trim whitespace (Original)
                </button>
                <button
                  onClick={() => trimWhitespace('changed')}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Trim whitespace (Changed)
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={exportAsPDF}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={exportAsExcel}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {(originalText || changedText) && (
          <div className="mb-6">
            {diffMode === 'unified' ? renderUnifiedDiff() : renderSplitDiff()}
          </div>
        )}

        {savedDiffs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Diffs</h3>
            <div className="space-y-2">
              {savedDiffs.map((diff) => (
                <div
                  key={diff.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setOriginalText(diff.original);
                    setChangedText(diff.changed);
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{diff.name}</p>
                    <p className="text-xs text-gray-500">{diff.date.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedDiffs(savedDiffs.filter(d => d.id !== diff.id));
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
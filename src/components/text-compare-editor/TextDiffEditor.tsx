import React, { useState, useMemo } from 'react';
import { diffWords, diffLines, diffChars } from 'diff';
import { Copy, Check, Download, Share2, ChevronDown, X } from 'lucide-react';

export default function TextDiffEditor() {
  const [originalText, setOriginalText] = useState('hello 12 wordl yes test');
  const [changedText, setChangedText] = useState('hello 12 world test');
  const [diffMode, setDiffMode] = useState('split');
  const [highlightMode, setHighlightMode] = useState('word');
  const [showTools, setShowTools] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedChanged, setCopiedChanged] = useState(false);
  const [savedDiffs, setSavedDiffs] = useState<{ id: string; name: string; original: string; changed: string; date: Date; }[]>([]);

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

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 500);
    } else {
      setCopiedChanged(true);
      setTimeout(() => setCopiedChanged(false), 500);
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

  const renderInlineDiff = (original: string, changed: string) => {
    const diffs = highlightMode === 'word' ? diffWords(original, changed) : diffChars(original, changed);
    return diffs.map((part, idx) => {
      if (part.removed) {
        return <span key={idx} className="bg-red-200 text-red-900 px-0.5 rounded">{part.value}</span>;
      } else if (part.added) {
        return <span key={idx} className="bg-green-200 text-green-900 px-0.5 rounded">{part.value}</span>;
      } else {
        return <span key={idx}>{part.value}</span>;
      }
    });
  };

  const renderUnifiedDiff = () => {
    const originalLines = originalText.split('\n');
    const changedLines = changedText.split('\n');
    
    // Create unified diff that groups modifications together like diffchecker.com
    const unifiedLines: { type: string; line: string; lineNumber: number; comparedTo?: string; }[] = [];
    const maxLines = Math.max(originalLines.length, changedLines.length);
    
    let removedCount = 0;
    let addedCount = 0;
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const changedLine = changedLines[i] || '';
      
      if (originalLine === changedLine) {
        // Lines are the same
        if (originalLine || changedLine) { // Don't show empty lines at the end
          unifiedLines.push({
            type: 'unchanged',
            line: originalLine,
            lineNumber: i + 1
          });
        }
      } else {
        // Lines are different - show as modification
        if (originalLine) {
          unifiedLines.push({
            type: 'removed',
            line: originalLine,
            lineNumber: i + 1,
            comparedTo: changedLine
          });
          removedCount++;
        }
        if (changedLine) {
          unifiedLines.push({
            type: 'added',
            line: changedLine,
            lineNumber: i + 1,
            comparedTo: originalLine
          });
          addedCount++;
        }
      }
    }

    return (
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Unified diff</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {removedCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
                  {removedCount} removal{removedCount !== 1 ? 's' : ''}
                </span>
              )}
              {addedCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                  {addedCount} addition{addedCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              const diffText = unifiedLines.map(item => {
                const prefix = item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  ';
                return prefix + item.line;
              }).join('\n');
              copyToClipboard(diffText, 'original');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 font-mono text-sm overflow-auto max-h-[600px]">
          {unifiedLines.map((item, index) => (
            <div
              key={index}
              className={`flex py-1 ${
                item.type === 'added' ? 'bg-green-50' : 
                item.type === 'removed' ? 'bg-red-50' : ''
              }`}
            >
              <span className="w-12 text-right pr-4 text-gray-400 select-none text-xs">
                {item.lineNumber}
              </span>
              <span className="flex-1">
                {item.type === 'removed' && (
                  <>
                    <span className="text-red-600 mr-2">-</span>
                    <span>
                      {item.comparedTo ? 
                        renderInlineDiff(item.line, item.comparedTo).filter((part: any, idx: number) => 
                          React.isValidElement(part) ? 
                            part.props.className?.includes('bg-red-200') || !part.props.className?.includes('bg-green-200')
                            : true
                        ) : 
                        <span className="bg-red-200 text-red-900 px-0.5 rounded">{item.line}</span>
                      }
                    </span>
                  </>
                )}
                {item.type === 'added' && (
                  <>
                    <span className="text-green-600 mr-2">+</span>
                    <span>
                      {item.comparedTo ? 
                        renderInlineDiff(item.comparedTo, item.line).filter((part: any, idx: number) => 
                          React.isValidElement(part) ? 
                            part.props.className?.includes('bg-green-200') || !part.props.className?.includes('bg-red-200')
                            : true
                        ) : 
                        <span className="bg-green-200 text-green-900 px-0.5 rounded">{item.line}</span>
                      }
                    </span>
                  </>
                )}
                {item.type === 'unchanged' && (
                  <>
                    <span className="text-gray-400 mr-2"> </span>
                    <span>{item.line}</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSplitDiff = () => {
    const originalLines = originalText.split('\n');
    const changedLines = changedText.split('\n');
    const maxLines = Math.max(originalLines.length, changedLines.length);

    // Create a simple line-by-line comparison
    const alignedLines = [];
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const changedLine = changedLines[i] || '';
      
      alignedLines.push({
        original: originalLine,
        changed: changedLine,
        lineNumber: i + 1
      });
    }

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
            {alignedLines.map((line, index) => {
              const hasChange = line.original !== line.changed;
              return (
                <div 
                  key={index} 
                  className={`flex py-0.5 ${hasChange ? 'bg-red-50' : ''}`}
                >
                  <span className="w-12 text-right pr-4 text-gray-400 select-none text-xs">
                    {line.original ? line.lineNumber : ''}
                  </span>
                  <span className="flex-1">
                    {hasChange && line.original && line.changed ? 
                      renderInlineDiff(line.original, line.changed).filter((part, idx, arr) => 
                        // Only show removed parts for original side
                        React.isValidElement(part) ? 
                          part.props.className?.includes('bg-red-200') || !part.props.className?.includes('bg-green-200')
                          : true
                      ) : 
                      line.original || <span className="text-gray-300">&nbsp;</span>
                    }
                  </span>
                </div>
              );
            })}
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
            {alignedLines.map((line, index) => {
              const hasChange = line.original !== line.changed;
              return (
                <div 
                  key={index} 
                  className={`flex py-0.5 ${hasChange ? 'bg-green-50' : ''}`}
                >
                  <span className="w-12 text-right pr-4 text-gray-400 select-none text-xs">
                    {line.changed ? line.lineNumber : ''}
                  </span>
                  <span className="flex-1">
                    {hasChange && line.original && line.changed ? 
                      renderInlineDiff(line.original, line.changed).filter((part, idx, arr) => 
                        // Only show added parts for changed side
                        React.isValidElement(part) ? 
                          part.props.className?.includes('bg-green-200') || !part.props.className?.includes('bg-red-200')
                          : true
                      ) : 
                      line.changed || <span className="text-gray-300">&nbsp;</span>
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Text Diff Editor</h1>
          <p className="text-gray-600">Compare and find differences between two text files</p>
        </div>

        <div className="py-2 mb-6">
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
                className="outline-none w-full h-72 p-2 border-2 border-gray-300 rounded-sm focus:border-green-500 resize-none font-mono text-sm"
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
                className="outline-none w-full h-72 p-2 border-2 border-gray-300 rounded-sm focus:border-green-500 resize-none font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Highlight:</label>
                <select
                  value={highlightMode}
                  onChange={(e) => setHighlightMode(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="word">Word</option>
                  <option value="character">Character</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">View:</label>
                <select
                  value={diffMode}
                  onChange={(e) => setDiffMode(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="unified">Unified</option>
                  <option value="split">Split</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                Save
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
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
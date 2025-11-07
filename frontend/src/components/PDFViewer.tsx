/**
 * PDFViewer Component
 *
 * Displays a scrollable PDF document viewer using react-pdf library.
 * Features:
 * - Renders all pages of the PDF
 * - Scrollable interface
 * - Page numbers
 * - Loading and error states
 * - Text highlighting with multiple colors
 * - Click to remove highlights
 * - Clear all highlights
 */

import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker - use local copy bundled with pdfjs-dist
// This avoids CORS issues with CDN loading
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  fileUrl: string;                           // URL or blob URL of the PDF file
  onLoadSuccess?: (numPages: number) => void;  // Optional callback when PDF loads
}

// Highlight data structure
interface Highlight {
  id: string;
  pageNumber: number;
  rects: DOMRect[];  // Selection rectangles
  color: string;     // Highlight color
  text: string;      // Selected text for reference
}

// Available highlight colors
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'rgba(255, 255, 0, 0.3)', border: '#ffd700' },
  { name: 'Green', value: 'rgba(144, 238, 144, 0.3)', border: '#90ee90' },
  { name: 'Blue', value: 'rgba(135, 206, 250, 0.3)', border: '#87ceeb' },
  { name: 'Pink', value: 'rgba(255, 192, 203, 0.3)', border: '#ffb6c1' },
  { name: 'Orange', value: 'rgba(255, 165, 0, 0.3)', border: '#ffa500' },
];

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, onLoadSuccess }) => {
  // Track total number of pages in the PDF
  const [numPages, setNumPages] = useState<number>(0);
  // Track any errors that occur during PDF loading
  const [error, setError] = useState<string | null>(null);
  // Track all highlights
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  // Track currently selected highlight color
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  // References to page containers for coordinate calculations
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  // Track current text selection for showing highlight button
  const [selectionData, setSelectionData] = useState<{
    pageNumber: number;
    rects: DOMRect[];
    text: string;
    position: { x: number; y: number };
  } | null>(null);
  // Track which highlight is showing delete UI
  const [highlightToDelete, setHighlightToDelete] = useState<string | null>(null);

  /**
   * Called when PDF document loads successfully
   * Updates state and calls parent callback if provided
   */
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
    onLoadSuccess?.(numPages);
  };

  /**
   * Called when PDF document fails to load
   * Sets error message for display to user
   */
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try uploading again.');
  };

  /**
   * Handles text selection and shows highlight button
   * Captures selected text and its bounding rectangles
   */
  const handleTextSelection = (pageNumber: number) => {
    // Use setTimeout to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return; // No text selected
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (!selectedText) {
        return; // Empty selection
      }

      // Get all rectangles for the selection (handles multi-line selections)
      const rects = Array.from(range.getClientRects());

      if (rects.length === 0) {
        return;
      }

      // Get the page container to calculate relative positions
      const pageContainer = pageRefs.current[pageNumber];
      if (!pageContainer) {
        return;
      }

      const pageRect = pageContainer.getBoundingClientRect();

      // Convert client rectangles to positions relative to the page
      const relativeRects = rects.map(rect => {
        const relativeRect = new DOMRect(
          rect.left - pageRect.left,
          rect.top - pageRect.top,
          rect.width,
          rect.height
        );
        return relativeRect;
      });

      // Calculate position for highlight button (above first rectangle)
      const firstRect = rects[0];
      const buttonPosition = {
        x: firstRect.left - pageRect.left,
        y: firstRect.top - pageRect.top - 40, // 40px above selection
      };

      // Store selection data
      setSelectionData({
        pageNumber,
        rects: relativeRects,
        text: selectedText,
        position: buttonPosition,
      });
    }, 10);
  };

  /**
   * Creates a highlight from the current selection
   */
  const createHighlight = () => {
    if (!selectionData) return;

    const newHighlight: Highlight = {
      id: Date.now().toString() + Math.random(),
      pageNumber: selectionData.pageNumber,
      rects: selectionData.rects,
      color: selectedColor.value,
      text: selectionData.text,
    };

    setHighlights(prev => [...prev, newHighlight]);

    // Clear selection
    setSelectionData(null);
    window.getSelection()?.removeAllRanges();
  };

  /**
   * Shows delete UI for a highlight when clicked
   */
  const showDeleteUI = (highlightId: string) => {
    setHighlightToDelete(highlightId);
  };

  /**
   * Removes a highlight permanently
   */
  const confirmRemoveHighlight = (highlightId: string) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setHighlightToDelete(null);
  };

  /**
   * Clears all highlights from the document
   */
  const clearAllHighlights = () => {
    setHighlights([]);
    setHighlightToDelete(null);
  };

  /**
   * Renders highlight overlays for a specific page
   * Creates absolutely positioned divs for each highlight rectangle
   */
  const renderHighlights = (pageNumber: number) => {
    const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

    return (
      <>
        {pageHighlights.map(highlight => (
          <React.Fragment key={highlight.id}>
            {highlight.rects.map((rect, rectIndex) => (
              <div
                key={`${highlight.id}-${rectIndex}`}
                data-highlight-id={highlight.id}
                className="absolute pointer-events-auto cursor-pointer hover:opacity-75 transition-opacity"
                style={{
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundColor: highlight.color,
                  mixBlendMode: 'multiply',
                  zIndex: 100,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  showDeleteUI(highlight.id);
                }}
                title="Click to show delete button"
              />
            ))}
          </React.Fragment>
        ))}
        {/* Delete icon - render outside highlight loop for proper z-index */}
        {highlightToDelete && pageHighlights.find(h => h.id === highlightToDelete) && (() => {
          const highlight = pageHighlights.find(h => h.id === highlightToDelete)!;
          if (highlight.rects.length === 0) return null;

          return (
            <div
              className="absolute pointer-events-auto"
              style={{
                left: `${highlight.rects[0].x + highlight.rects[0].width / 2 - 20}px`,
                top: `${highlight.rects[0].y - 45}px`,
                zIndex: 50,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  confirmRemoveHighlight(highlight.id);
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors flex items-center justify-center"
                title="Delete highlight"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          );
        })()}
      </>
    );
  };

  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
      {/* Color Picker Toolbar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Highlight Color:</span>
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    selectedColor.name === color.name
                      ? 'border-gray-800 dark:border-gray-200 scale-110'
                      : 'border-gray-300 dark:border-gray-500 hover:border-gray-500 dark:hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  aria-label={`Select ${color.name} highlight color`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({highlights.length} highlight{highlights.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            onClick={clearAllHighlights}
            disabled={highlights.length === 0}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              highlights.length > 0
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
            }`}
            aria-label="Clear all highlights"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          /* Error State - shown when PDF fails to load */
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : (
          /* PDF Document - renders when no errors */
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              /* Loading State - shown while PDF is loading */
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
            className="flex flex-col items-center gap-4"
            onClick={() => {
              // Dismiss UIs when clicking in margins between pages
              setSelectionData(null);
              setHighlightToDelete(null);
            }}
          >
            {/* Render all pages of the PDF */}
            {Array.from(new Array(numPages), (el, index) => (
              <div
                key={`page_${index + 1}`}
                className="shadow-lg relative"
                ref={(el) => (pageRefs.current[index + 1] = el)}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  handleTextSelection(index + 1);
                }}
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={true}      // Enable text selection
                  renderAnnotationLayer={true} // Enable PDF annotations
                  className="max-w-full"
                  width={700} // Fixed width for better readability
                />
                {/* Highlight overlay layer */}
                <div
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 100 }}
                >
                  {renderHighlights(index + 1)}
                </div>

                {/* Floating highlight button - shown when text is selected on this page */}
                {selectionData && selectionData.pageNumber === index + 1 && (
                  <div
                    className="absolute pointer-events-auto z-20"
                    style={{
                      left: `${selectionData.position.x}px`,
                      top: `${selectionData.position.y}px`,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createHighlight();
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-full p-2.5 shadow-lg transition-colors flex items-center justify-center"
                      title="Highlight selected text"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path
                          fillRule="evenodd"
                          d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Page number indicator */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
                  Page {index + 1} of {numPages}
                </div>
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

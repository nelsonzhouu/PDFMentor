/**
 * PDFMentor - Main Entry Point
 *
 * This file serves as the application's entry point, rendering the root App component
 * into the DOM. It uses React 18's createRoot API for concurrent rendering features.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Create root element and render the application
// The non-null assertion (!) is safe because we know #root exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

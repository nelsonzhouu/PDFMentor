/** @type {import('tailwindcss').Config} */

// Tailwind CSS configuration for PDFMentor
// Defines content sources, theme customizations, and plugins
export default {
  // Enable dark mode using class strategy
  darkMode: 'class',
  // Specify which files to scan for Tailwind class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom color palette for the application
      colors: {
        primary: '#3b82f6',      // Blue color for primary actions
        secondary: '#8b5cf6',    // Purple color for secondary elements
      }
    },
  },
  plugins: [],
}

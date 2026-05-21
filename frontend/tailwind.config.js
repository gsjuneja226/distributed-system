/**
 * easycompute Design System Configuration
 * =====================================
 * Defines the persistent visual tokens (colors, typography, spacing) 
 * for the Tailwind CSS framework.
 * 
 * Theme Identity:
 * - Base: Deep Zinc/Neutral dark mode (#09090B).
 * - Accents: High-vibrancy Violet (#8B5CF6) and Mint (#10B981).
 * - Semantic: Detailed status mapping for the job lifecycle.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Layout Backgrounds
        bg: {
          page: '#09090B',
          card: '#18181B',
          hover: '#27272A',
          sidebar: '#09090B',
          input: '#0F0F0F',
        },
        // Borders and Dividers
        border: {
          DEFAULT: '#27272A',
          accent: '#3F3F46',
        },
        'border-DEFAULT': '#27272A',
        'border-accent': '#3F3F46',
        // Primary Action Color
        primary: {
          blue: '#8B5CF6',
        },
        // Semantic Accents
        accent: {
          cyan: '#06B6D4',
          mint: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#A855F7',
          pink: '#EC4899', 
        },
        // Typography Tokens
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#52525B',
          mono: '#D4D4D8',
        },
        /**
         * Semantic Status Mapping
         * Used for background and text colors of StatusBadges.
         */
        status: {
          queuedBg: '#18181B',
          queuedText: '#71717A',
          dispatchedBg: '#2E1065',
          dispatchedText: '#C4B5FD',
          runningBg: '#451A03',
          runningText: '#FDBA74',
          doneBg: '#064E3B',
          doneText: '#6EE7B7',
          failedBg: '#450A0A',
          failedText: '#FCA5A5',
          expiredBg: '#18181B',
          expiredText: '#71717A',
        }
      },
      fontFamily: {
        // Inter provides a clean, modern aesthetic for the dashboard UI.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // JetBrains Mono is used for IDs, logs, and technical metrics.
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

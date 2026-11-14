/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0B132B",
          hover: "#1C2541",
          active: "#3A506B",
          text: "#E2E8F0",
          muted: "#94A3B8",
          border: "#1E293B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          subtle: "#F1F5F9",
          border: "#E2E8F0",
          hover: "#F8FAFC",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          900: "#0F172A",
        },
        signal: {
          opportunity: "#059669",
          threat: "#E11D48",
          neutral: "#64748B",
          critical: "#DC2626",
          high: "#EA580C",
          medium: "#D97706",
          low: "#0284C7",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 2px 5px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

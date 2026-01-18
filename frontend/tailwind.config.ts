import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF9F6",
        paper: "#FFFFFF",
        fjord: {
          50: "#EEF4F7",
          100: "#D4E3EA",
          200: "#A9C7D5",
          300: "#7EABC0",
          400: "#538FAB",
          500: "#2D4A5E",
          600: "#253D4D",
          700: "#1C2F3B",
          800: "#14222A",
          900: "#0B1418",
        },
        stone: {
          DEFAULT: "#6B7280",
          light: "#9CA3AF",
          dark: "#374151",
        },
        forest: {
          50: "#EDF2EF",
          100: "#D2E0D7",
          200: "#A5C1AF",
          300: "#78A287",
          400: "#4B835F",
          500: "#3D5A47",
          600: "#324A3B",
          700: "#263A2E",
          800: "#1B2922",
          900: "#0F1915",
        },
        amber: {
          warm: "#C4956A",
          light: "#E8D4BC",
          dark: "#8B6914",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "paper-hover": "0 4px 12px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        "paper-lifted": "0 8px 24px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

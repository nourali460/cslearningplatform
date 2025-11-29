import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: "rgb(var(--background) / <alpha-value>)",
        "background-secondary": "rgb(var(--background-secondary) / <alpha-value>)",
        "background-tertiary": "rgb(var(--background-tertiary) / <alpha-value>)",

        // Foreground/Text
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        "foreground-secondary": "rgb(var(--foreground-secondary) / <alpha-value>)",
        "foreground-tertiary": "rgb(var(--foreground-tertiary) / <alpha-value>)",

        // Borders
        border: "rgb(var(--border) / <alpha-value>)",
        "border-secondary": "rgb(var(--border-secondary) / <alpha-value>)",

        // Accents
        "accent-orange": "rgb(var(--accent-orange) / <alpha-value>)",
        "accent-orange-hover": "rgb(var(--accent-orange-hover) / <alpha-value>)",
        "accent-purple": "rgb(var(--accent-purple) / <alpha-value>)",
        "accent-purple-hover": "rgb(var(--accent-purple-hover) / <alpha-value>)",

        // States
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",

        // Semantic
        card: "rgb(var(--card-bg) / <alpha-value>)",
        input: "rgb(var(--input-bg) / <alpha-value>)",
        hover: "rgb(var(--hover-bg) / <alpha-value>)",
        selected: "rgb(var(--selected-bg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;

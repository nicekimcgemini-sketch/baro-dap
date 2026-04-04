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
        background: "var(--background)",
        foreground: "var(--foreground)",
        spring: {
          pink:           "#FF2A7A",
          "pink-light":   "#FFE8F2",
          "pink-border":  "#FFBAD8",
          emerald:        "#00D9A5",
          "emerald-light":"#E0FBF5",
          "emerald-dark": "#00A88C",
          blue:           "#00B4D8",
          orange:         "#FFB300",
          yellow:         "#FFD93D",
          bg:             "#F4FBF9",
          text:           "#13003A",
          "text-light":   "#6B5B8A",
          soft:           "#F0FBF8",
        },
        priority: {
          critical: "#F43F5E",
          high:     "#F97316",
          medium:   "#06B6D4",
          low:      "#34D399",
          lowest:   "#94A3B8",
        },
      },
      backgroundImage: {
        "spring-gradient": "linear-gradient(135deg, #00C2A0 0%, #00B4D8 50%, #FF2A7A 100%)",
        "spring-soft":     "linear-gradient(180deg, #F4FBF9 0%, #ffffff 100%)",
        "wing-gradient":   "linear-gradient(135deg, rgba(0,217,165,0.8), rgba(0,180,216,0.4), rgba(255,42,122,0.8))",
      },
      boxShadow: {
        feather: "0 10px 40px -10px rgba(0,217,165,0.15), 0 4px 15px -5px rgba(255,42,122,0.1)",
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;

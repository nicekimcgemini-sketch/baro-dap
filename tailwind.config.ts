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
          pink:           "#FF6B9D",
          "pink-light":   "#FFE8F2",
          "pink-border":  "#FFBAD8",
          emerald:        "#00C9A7",
          "emerald-light":"#E6F9F6",
          "emerald-dark": "#00A88C",
          yellow:         "#FFD93D",
          bg:             "#FFF5F9",
          text:           "#2D1B4E",
          "text-light":   "#7A5C8A",
        },
      },
      backgroundImage: {
        "spring-gradient": "linear-gradient(135deg, #FF6B9D 0%, #00C9A7 100%)",
        "spring-soft":     "linear-gradient(180deg, #FFF5F9 0%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
};
export default config;

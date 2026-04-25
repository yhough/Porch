import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        porch: {
          bg: "#FFFDF9",
          coral: "#E8513A",
          yellow: "#F5C842",
          sage: "#4CAF82",
          sky: "#5BA4CF",
          navy: "#1B2A4A",
          "coral-light": "#FFF0ED",
          "yellow-light": "#FFFBEB",
          "sage-light": "#EDFAF4",
          "sky-light": "#EDF5FB",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        pill: "9999px",
        xl2: "20px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.14)",
        "button": "0 4px 12px rgba(232,81,58,0.30)",
      },
      fontSize: {
        "hero": ["48px", { lineHeight: "1.1", fontWeight: "800" }],
        "section": ["36px", { lineHeight: "1.15", fontWeight: "800" }],
        "card-title": ["22px", { lineHeight: "1.2", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
export default config;

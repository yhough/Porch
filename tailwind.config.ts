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
          bg: "#FAF9F6",
          navy: "#1B2A4A",
          amber: "#E8A020",
          sage: "#4A7C59",
          coral: "#E06B5A",
          purple: "#7C5C9A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;

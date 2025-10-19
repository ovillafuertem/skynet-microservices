import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC"
        },
        accent: {
          DEFAULT: "#0EA5E9"
        }
      }
    }
  },
  plugins: []
};

export default config;

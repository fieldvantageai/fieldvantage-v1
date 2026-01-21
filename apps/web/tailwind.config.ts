import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#e6f0ff",
          200: "#c7dbff",
          300: "#9ec0ff",
          400: "#6a9cff",
          500: "#3f78ff",
          600: "#2a5fe6",
          700: "#2247b4",
          800: "#1f3a8a",
          900: "#1e336f"
        }
      }
    }
  }
};

export default config;

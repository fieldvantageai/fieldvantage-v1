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
        /* Geklix Emerald — primary brand palette
           Centred on #16C784. All brand-* utilities now render emerald. */
        brand: {
          50:  "#f0fdf9",
          100: "#ccfbee",
          200: "#99f6dc",
          300: "#5eeec4",
          400: "#2ddba8",
          500: "#16C784",
          600: "#16C784",
          700: "#12B76A",
          800: "#0E9F6E",
          900: "#065f46",
          950: "#032d22"
        }
      }
    }
  }
};

export default config;

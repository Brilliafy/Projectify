/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // make sure it scans your React files
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/typography"),
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/theme/object")["light"],
          "base-100": "#f1f5f9", // slate-100
          "base-200": "#e2e8f0", // slate-200
          "base-300": "#cbd5e1", // slate-300
          "base-content": "#0f172a", // slate-900 (text)
        },
        dark: {
          ...require("daisyui/theme/object")["dark"],
          "base-100": "#0f172a", // slate-900
          "base-200": "#1e293b", // slate-800
          "base-300": "#334155", // slate-700
          "base-content": "#f1f5f9", // slate-100 (text)
        },
      },
    ],
  },
};
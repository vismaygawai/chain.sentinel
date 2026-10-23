/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        electric: "#0096ff",
        'electric-hover': "#0080db",
        brutal: {
          black: "#0a0a0a",
          white: "#ffffff",
          gray: "#f4f4f4",
          border: "#000000",
        },
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "system-ui", "sans-serif"],
        body: ["'Satoshi'", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "'Playfair Display'", "Georgia", "serif"],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-md': '6px 6px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-blue': '4px 4px 0px 0px #0096ff',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
      },
    },
  },
  plugins: [],
};

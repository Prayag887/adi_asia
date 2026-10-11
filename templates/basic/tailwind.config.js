/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,js,ts}'],
  theme: {
    extend: {
      // Put the client's brand here.
      colors: {
        brand: { DEFAULT: '#1f3a5f', light: '#2d5486' },
        accent: '#c08a3e',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
    },
  },
}

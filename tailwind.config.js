/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom ADI Colors - Darker, more premium
        diplomatic: {
          blue: '#0f1e33',
          DEFAULT: '#0f1e33',
          dark: '#0a1525',
          light: '#1a2942',
        },
        ivory: '#f8f6f1',
        gold: {
          DEFAULT: '#b8946a',
          light: '#c9a87a',
          dark: '#a08055',
          muted: '#9a7b52',
        },
        slate: {
          custom: '#4a5568',
        },
        teal: {
          muted: '#1e4040',
          DEFAULT: '#1e4040',
        },
        sage: {
          soft: '#6b7a5e',
        },
        sand: {
          light: '#e8e4dc',
          dark: '#d5d0c5',
        },
        success: '#3d6b4a',
        alert: '#c4946a',
        charcoal: '#1a202c',
      },
      fontFamily: {
        'cormorant': ['Cormorant Garamond', 'Georgia', 'serif'],
        'garamond': ['EB Garamond', 'Georgia', 'serif'],
        'cinzel': ['Cinzel', 'serif'],
        'baskerville': ['Libre Baskerville', 'Georgia', 'serif'],
        // Inter stays as the UI/body font for reliable sizing and alignment
        'inter': ['Inter', 'sans-serif'],
        // playfair alias now maps to Libre Baskerville for a premium feel
        'playfair': ['Libre Baskerville', 'Georgia', 'serif'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '1.1', letterSpacing: '-1px', fontWeight: '700' }],
        'section': ['48px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '600' }],
        'card-title': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '1.7', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 4px 24px rgba(15, 30, 51, 0.08)',
        'card-hover': '0 12px 40px rgba(15, 30, 51, 0.15)',
        'elevated': '0 24px 64px rgba(0, 0, 0, 0.35)',
        'subtle': '0 2px 12px rgba(15, 30, 51, 0.06)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.03)" },
        },
        "wave": {
          "0%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(10px) translateY(-10px)" },
          "50%": { transform: "translateX(0) translateY(-20px)" },
          "75%": { transform: "translateX(-10px) translateY(-10px)" },
          "100%": { transform: "translateX(0) translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-60px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(60px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "particle-drift": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "0.2" },
          "25%": { transform: "translate(20px, -20px) rotate(90deg)", opacity: "0.4" },
          "50%": { transform: "translate(0, -40px) rotate(180deg)", opacity: "0.3" },
          "75%": { transform: "translate(-20px, -20px) rotate(270deg)", opacity: "0.4" },
          "100%": { transform: "translate(0, 0) rotate(360deg)", opacity: "0.2" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "wave": "wave 25s ease-in-out infinite",
        "gradient-shift": "gradient-shift 40s ease infinite",
        "bounce-subtle": "bounce-subtle 2.5s ease-in-out infinite",
        "count-up": "count-up 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "slide-in-left": "slide-in-left 1s ease-out forwards",
        "slide-in-right": "slide-in-right 1s ease-out forwards",
        "scale-in": "scale-in 0.7s ease-out forwards",
        "particle-drift": "particle-drift 35s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

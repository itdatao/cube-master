/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        face: {
          u: '#f8fafc',
          d: '#fbbf24',
          f: '#22c55e',
          b: '#3b82f6',
          r: '#ef4444',
          l: '#f97316',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(49,46,129,0.25)',
        clay: '6px 6px 14px rgba(49,46,129,0.12), -6px -6px 14px rgba(255,255,255,0.9)',
        press: 'inset 2px 2px 5px rgba(49,46,129,0.16), inset -2px -2px 5px rgba(255,255,255,0.85)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

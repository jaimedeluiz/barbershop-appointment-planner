/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f6f6f7',
          100: '#e2e2e5',
          200: '#c5c5cb',
          300: '#9e9ea9',
          400: '#757582',
          500: '#5c5c68',
          600: '#464650',
          700: '#34343c',
          800: '#232328',
          900: '#151518',
          950: '#0d0d0f',
        },
        copper: {
          50: '#fdf8f4',
          100: '#faefe6',
          200: '#f4decb',
          300: '#ecc5a6',
          400: '#e1a478',
          500: '#d98852',
          600: '#cb6e39',
          700: '#a9542a',
          800: '#874427',
          900: '#6f3923',
          950: '#3c1c0f',
        },
        gold: {
          50: '#fbf8eb',
          100: '#f5eece',
          200: '#ebd999',
          300: '#dfbf5f',
          400: '#d4a833',
          500: '#bc8f22',
          600: '#9b6e19',
          700: '#764f17',
          800: '#634019',
          900: '#54361a',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}


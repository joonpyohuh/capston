/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        toss: {
          blue: '#3182F6',
          'blue-hover': '#1B64DA',
          'blue-light': '#EBF3FE',
          'gray-50': '#F9FAFB',
          'gray-100': '#F2F4F6',
          'gray-200': '#E5E8EB',
          'gray-300': '#D1D6DB',
          'gray-400': '#B0B8C1',
          'gray-500': '#8B95A1',
          'gray-600': '#6B7684',
          'gray-700': '#4E5968',
          'gray-800': '#333D4B',
          'gray-900': '#191F28',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'Apple SD Gothic Neo',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 20px 0 rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}

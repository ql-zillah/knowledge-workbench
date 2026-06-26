/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 沿用原工作台的暖色调主题
        bg: '#FFF8F0',
        card: '#FFFFFF',
        primary: '#E07B5A',
        'primary-light': '#FDF0EA',
        'primary-dark': '#D46A4A',
        secondary: '#5B8FA8',
        'secondary-light': '#EDF4F7',
        accent: '#6BAF7B',
        'accent-light': '#EDF6EF',
        purple: '#9B7EC4',
        'purple-light': '#F5F1FA',
        amber: '#D4952A',
        'amber-light': '#FFF8EC',
        border: '#EDE4D8',
        'text-main': '#3D3226',
        'text-secondary': '#6B5E4F',
        'text-muted': '#A89888',
      },
      boxShadow: {
        card: '0 2px 12px rgba(61,50,38,0.05)',
        'card-hover': '0 6px 24px rgba(61,50,38,0.1)',
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
      },
    },
  },
  plugins: [],
}

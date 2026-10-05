/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      fontWeight: {
        '400': '400',
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      colors: {
        // Pure white base palette
        base: {
          50: '#FFFFFF',
          100: '#FAFCFD',
          200: '#F4F9FA',
          300: '#EAF4F6', // Hero card background tint
          400: '#D5E9ED',
          500: '#92C7CF', // User requested hero color (#92C7CF)
          600: '#75B5BE',
          700: '#549BA5',
          800: '#387B85',
          900: '#1D4D54',
          950: '#0E292E',
        },
        // Hero requested 92C7CF palette
        rescue: {
          50: '#F0F8FA',
          100: '#E4F3F5',
          200: '#CEEAEF',
          300: '#B0DEE5',
          400: '#92C7CF', // Exact user color: #92C7CF
          500: '#75B5BE',
          600: '#599EA8',
          700: '#43838D',
          800: '#316770',
          900: '#1E464D',
          950: '#0E282D',
        },
        // Crisp Dark Text tones
        surface: {
          50: '#111827',  // Primary deep black text
          100: '#1F2937',
          200: '#374151',
          300: '#4B5563',
          400: '#6B7280', // Muted text
          500: '#9CA3AF',
          600: '#D1D5DB',
          700: '#E5E7EB',
          800: '#F3F4F6',
          900: '#F9FAFB',
          950: '#FFFFFF',
        },
        // Accent urgency amber
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#D97706',
          600: '#B45309',
        },
        // Alert rose
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          400: '#F43F5E',
          500: '#E11D48',
          600: '#BE123C',
        },
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0, 0, 0, 0.05)',
        'hero': '0 8px 30px rgba(146, 199, 207, 0.15)',
        'cuboid': '12px 12px 0px 0px #111827',
        'cuboid-cyan': '12px 12px 0px 0px #92C7CF',
        'cuboid-sm': '6px 6px 0px 0px #111827',
        'cta-black': '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

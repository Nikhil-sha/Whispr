tailwind.config = {
 darkMode: 'class',
 theme: {
  extend: {
   colors: {
    primary: {
     50: '#f0f9ff',
     100: '#e0f2fe',
     200: '#bae6fd',
     300: '#7dd3fc',
     400: '#38bdf8',
     500: '#0ea5e9',
     600: '#0284c7',
     700: '#0369a1',
     800: '#075985',
     900: '#0c4a6e',
    },
    secondary: {
     500: '#8b5cf6',
     600: '#7c3aed',
    },
    surface: {
     0: '#ffffff',
     50: '#f8fafc',
     100: '#f1f5f9',
     200: '#e2e8f0',
     300: '#cbd5e1',
     400: '#94a3b8',
     500: '#64748b',
     600: '#475569',
     700: '#334155',
     800: '#1e293b',
     900: '#0f172a',
     950: '#020617'
    }
   },
   spacing: {
    4.5: '1.125rem',
    7.5: '1.875rem',
    15: '3.75rem',
    18: '4.5rem',
    22: '5.5rem',
    30: '7.5rem',
    50: '12.5rem',
   },
   borderRadius: {
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    'full': '9999px',
   },
   fontSize: {
    '2xs': '0.625rem',
    '3xs': '0.5rem',
   },
   boxShadow: {
    'soft': '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
    'medium': '0 6px 16px -4px rgba(0, 0, 0, 0.08)',
    'hard': '0 8px 24px -6px rgba(0, 0, 0, 0.12)',
    'dark-soft': '0 4px 12px -2px rgba(0, 0, 0, 0.25)',
    'dark-medium': '0 6px 16px -4px rgba(0, 0, 0, 0.3)',
    'dark-hard': '0 8px 24px -6px rgba(0, 0, 0, 0.35)',
   }
  }
 }
}
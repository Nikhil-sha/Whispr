tailwind.config = {
 theme: {
  extend: {
   colors: {
    'pixel-blue': '#1a73e8',
    'pixel-blue-dark': '#1557b0',
    'pixel-gray-light': '#f8f9fa',
    'pixel-gray': '#e8eaed',
    'pixel-gray-dark': '#5f6368',
    'pixel-bg': '#f5f5f5',
   },
   animation: {
    'pixel-press': 'pixel-press 0.2s ease',
    'pixel-ripple': 'pixel-ripple 0.6s linear',
   },
   keyframes: {
    'pixel-press': {
     '0%, 100%': { transform: 'scale(1)' },
     '50%': { transform: 'scale(0.95)' },
    },
    'pixel-ripple': {
     '0%': { transform: 'scale(0)', opacity: '0.4' },
     '100%': { transform: 'scale(4)', opacity: '0' },
    },
   },
   boxShadow: {
    'pixel-button': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
    'pixel-header': '0 1px 2px 0 rgba(0,0,0,0.1)',
    'pixel-card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
   },
  },
 },
 plugins: [
  function({ addUtilities }) {
   addUtilities({
    '.pixel-scrollbar': {
     '&::-webkit-scrollbar': {
      'width': '8px',
     },
     '&::-webkit-scrollbar-track': {
      'background': '#f1f1f1',
      'border-radius': '4px',
     },
     '&::-webkit-scrollbar-thumb': {
      'background': '#888',
      'border-radius': '4px',
     },
     '&::-webkit-scrollbar-thumb:hover': {
      'background': '#555',
     },
    },
    '.pixel-tap-highlight': {
     '-webkit-tap-highlight-color': 'transparent',
    },
   })
  }
 ],
}
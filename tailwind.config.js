/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutros claros (60%)
        'neutral-50': '#FAFAFA',
        'neutral-100': '#F4F4F5',
        'neutral-200': '#E4E4E7',
        // Primario Carbón (30%)
        'carbon-900': '#27272A',
        'carbon-950': '#18181B',
        // Acento Violeta Eléctrico (10%)
        'violet-electric': '#6366F1',
        // Semantic colors
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};

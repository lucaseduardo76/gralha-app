/** @type {import('tailwindcss').Config} */
// Paleta extraída do UI kit Gofit (exportado em C:\gralha\Gofit - Fitness & Workout App UI Kit (Preview) (1)).
// Espelhada em src/lib/theme.ts para props que não aceitam className (ícones, navegação, StatusBar).
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7259F0', soft: '#8E7CF3', muted: '#6A5AB8', tint: '#EFEBFF' },
        background: { DEFAULT: '#FFFFFF', dark: '#181A20' },
        surface: { DEFAULT: '#F5F5F7', dark: '#1F222A' },
        elevated: { DEFAULT: '#EEEEEE', dark: '#35383F' },
        edge: { DEFAULT: '#EEEEEE', dark: '#2A2D35' },
        ink: { DEFAULT: '#212121', dark: '#FFFFFF' },
        muted: { DEFAULT: '#757575', dark: '#9E9E9E' },
        danger: '#F75555',
        warning: '#FACC15',
        info: '#246BFD',
        success: '#12D18E',
      },
      fontFamily: {
        regular: ['Urbanist_400Regular'],
        medium: ['Urbanist_500Medium'],
        semibold: ['Urbanist_600SemiBold'],
        bold: ['Urbanist_700Bold'],
      },
    },
  },
  plugins: [],
}

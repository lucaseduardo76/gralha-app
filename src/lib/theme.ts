// Mesmos valores do tailwind.config.js, para props que não aceitam className (ícones, navegação, StatusBar).
export const colors = {
  primary: '#7259F0',
  primarySoft: '#8E7CF3',
  danger: '#F75555',
  warning: '#FACC15',
  info: '#246BFD',
  success: '#12D18E',
  light: { background: '#FFFFFF', surface: '#F5F5F7', elevated: '#EEEEEE', edge: '#EEEEEE', ink: '#212121', muted: '#757575' },
  dark: { background: '#181A20', surface: '#1F222A', elevated: '#35383F', edge: '#2A2D35', ink: '#FFFFFF', muted: '#9E9E9E' },
} as const

export type Palette = { background: string; surface: string; elevated: string; edge: string; ink: string; muted: string }

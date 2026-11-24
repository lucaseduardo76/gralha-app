import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'nativewind'
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { colors, type Palette } from '../lib/theme'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  palette: Palette
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const STORAGE_KEY = 'gralhafit_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme()

  useEffect(() => {
    // Escuro é o padrão do app (como no kit Gofit); o usuário troca no Perfil.
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => setColorScheme(stored === 'light' ? 'light' : 'dark'))
  }, [setColorScheme])

  const theme: Theme = colorScheme === 'light' ? 'light' : 'dark'

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setColorScheme(next)
    AsyncStorage.setItem(STORAGE_KEY, next)
  }

  return <ThemeContext.Provider value={{ theme, palette: colors[theme], toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}

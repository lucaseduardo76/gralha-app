import './global.css'
// Import por peso: o índice do pacote carregaria os 18 arquivos da família no bundle.
import { Urbanist_400Regular } from '@expo-google-fonts/urbanist/400Regular'
import { Urbanist_500Medium } from '@expo-google-fonts/urbanist/500Medium'
import { Urbanist_600SemiBold } from '@expo-google-fonts/urbanist/600SemiBold'
import { Urbanist_700Bold } from '@expo-google-fonts/urbanist/700Bold'
import { useFonts } from 'expo-font'
import { useEffect, useState } from 'react'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AtualizacaoObrigatoria } from './src/components/AtualizacaoObrigatoria'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { loadApiUrl } from './src/lib/env'
import { colors } from './src/lib/theme'
import { RootNavigator } from './src/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: {
    // Erros 4xx não melhoram tentando de novo; falha de rede tenta 1x.
    queries: { retry: (falhas, erro) => falhas < 1 && !(erro as { status?: number }).status, staleTime: 30_000 },
  },
})

function AppContent() {
  const { theme, palette } = useTheme()
  const base = theme === 'dark' ? DarkTheme : DefaultTheme
  return (
    <NavigationContainer
      theme={{ ...base, colors: { ...base.colors, primary: colors.primary, background: palette.background, card: palette.background, text: palette.ink, border: palette.edge } }}
    >
      <AtualizacaoObrigatoria>
        <RootNavigator />
      </AtualizacaoObrigatoria>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  )
}

export default function App() {
  const [fontesProntas] = useFonts({ Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold })
  // Endereço da API salvo na tela de login: precisa estar carregado antes da primeira requisição.
  const [apiPronta, setApiPronta] = useState(false)
  useEffect(() => {
    loadApiUrl().finally(() => setApiPronta(true))
  }, [])
  if (!fontesProntas || !apiPronta) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

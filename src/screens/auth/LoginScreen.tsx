import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Lock, Mail, Settings } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { ServidorSheet } from '../../components/ServidorSheet'
import { Button, TextField } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { toApiError } from '../../lib/api'
import type { AuthStackParams } from '../../navigation/types'
import { AuthLayout, FooterLink, FormError } from './AuthLayout'

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [servidorAberto, setServidorAberto] = useState(false)
  const { palette } = useTheme()

  const entrar = async () => {
    if (!email.trim() || !senha) return setErro('Informe e-mail e senha.')
    setErro(null)
    setEnviando(true)
    try {
      await login(email.trim().toLowerCase(), senha)
    } catch (e) {
      setErro(toApiError(e).message)
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      title={'Entre na\nsua conta'}
      footer={<FooterLink text="Não tem conta?" link="Cadastre-se" onPress={() => navigation.replace('Cadastro')} />}
    >
      <TextField icon={Mail} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextField icon={Lock} placeholder="Senha" value={senha} onChangeText={setSenha} secure autoComplete="password" onSubmitEditing={entrar} />
      <FormError message={erro} />
      <Button title="Entrar" onPress={entrar} loading={enviando} disabled={!email || !senha} />
      <Pressable onPress={() => navigation.navigate('EsqueciSenha')} className="items-center py-2">
        <Text className="font-bold text-base text-primary">Esqueceu a senha?</Text>
      </Pressable>
      {/* Discreto de propósito: troca o endereço da API sem rebuildar o app. */}
      <Pressable onPress={() => setServidorAberto(true)} hitSlop={12} accessibilityLabel="Configurar servidor" className="mt-auto self-end p-1 opacity-30">
        <Settings size={16} color={palette.muted} />
      </Pressable>
      <ServidorSheet visible={servidorAberto} onClose={() => setServidorAberto(false)} />
    </AuthLayout>
  )
}

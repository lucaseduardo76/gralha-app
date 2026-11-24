import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Lock, Mail, User } from 'lucide-react-native'
import { useState } from 'react'
import { Button, TextField } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { toApiError } from '../../lib/api'
import type { AuthStackParams } from '../../navigation/types'
import { AuthLayout, FooterLink, FormError } from './AuthLayout'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CadastroScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Cadastro'>) {
  const { register } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Informe seu nome'
    if (!EMAIL_RE.test(email.trim())) e.email = 'E-mail inválido'
    if (senha.length < 6) e.senha = 'A senha deve ter pelo menos 6 caracteres' // mesma regra do backend
    setErros(e)
    return Object.keys(e).length === 0
  }

  const cadastrar = async () => {
    if (!validar()) return
    setErro(null)
    setEnviando(true)
    try {
      await register(nome.trim(), email.trim().toLowerCase(), senha)
    } catch (e) {
      const apiError = toApiError(e)
      if (apiError.fieldErrors) setErros(apiError.fieldErrors)
      else setErro(apiError.message)
      setEnviando(false)
    }
  }

  return (
    <AuthLayout title={'Crie sua\nconta'} footer={<FooterLink text="Já tem conta?" link="Entrar" onPress={() => navigation.replace('Login')} />}>
      <TextField icon={User} placeholder="Nome" value={nome} onChangeText={setNome} autoComplete="name" error={erros.nome} />
      <TextField icon={Mail} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={erros.email} />
      <TextField icon={Lock} placeholder="Senha" value={senha} onChangeText={setSenha} secure autoComplete="new-password" error={erros.senha} onSubmitEditing={cadastrar} />
      <FormError message={erro} />
      <Button title="Criar conta" onPress={cadastrar} loading={enviando} disabled={!nome || !email || !senha} />
    </AuthLayout>
  )
}

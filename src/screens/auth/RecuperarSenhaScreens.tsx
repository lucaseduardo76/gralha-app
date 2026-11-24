import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { CircleCheck, Lock, Mail } from 'lucide-react-native'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Button, TextField } from '../../components/ui'
import { confirmarRecuperacao, solicitarRecuperacao } from '../../api/auth'
import { toApiError } from '../../lib/api'
import { colors } from '../../lib/theme'
import type { AuthStackParams } from '../../navigation/types'
import { AuthLayout, FormError } from './AuthLayout'

const TAMANHO_CODIGO = 6
const ESPERA_REENVIO_SEG = 60

export function EsqueciSenhaScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'EsqueciSenha'>) {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    setErro(null)
    setEnviando(true)
    try {
      // O backend responde 204 sempre (não revela se o e-mail existe).
      await solicitarRecuperacao(email.trim().toLowerCase())
      navigation.navigate('CodigoSenha', { email: email.trim().toLowerCase() })
    } catch (e) {
      setErro(toApiError(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout title="Esqueceu a senha?" subtitle="Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos para criar uma nova senha.">
      <TextField icon={Mail} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <FormError message={erro} />
      <Button title="Enviar código" onPress={enviar} loading={enviando} disabled={!email.includes('@')} />
    </AuthLayout>
  )
}

/** Caixas de código no estilo do kit (tela "Forgot Password — type OTP"), sobre um TextInput invisível. */
function CodigoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null)
  return (
    <Pressable onPress={() => ref.current?.focus()} className="flex-row justify-between">
      {Array.from({ length: TAMANHO_CODIGO }, (_, i) => {
        const ativo = i === Math.min(value.length, TAMANHO_CODIGO - 1)
        return (
          <View
            key={i}
            className={`h-14 w-12 items-center justify-center rounded-xl border ${
              ativo ? 'border-primary bg-primary/10' : 'border-edge bg-surface dark:border-edge-dark dark:bg-surface-dark'
            }`}
          >
            <Text className="font-bold text-2xl text-ink dark:text-ink-dark">{value[i] ?? ''}</Text>
          </View>
        )
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, TAMANHO_CODIGO))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={TAMANHO_CODIGO}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  )
}

export function CodigoSenhaScreen({ navigation, route }: NativeStackScreenProps<AuthStackParams, 'CodigoSenha'>) {
  const { email } = route.params
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(ESPERA_REENVIO_SEG)

  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const reenviar = async () => {
    setEspera(ESPERA_REENVIO_SEG)
    await solicitarRecuperacao(email).catch((e) => setErro(toApiError(e).message))
  }

  const confirmar = async () => {
    if (senha.length < 6) return setErro('A nova senha deve ter pelo menos 6 caracteres.')
    if (senha !== confirmacao) return setErro('As senhas não conferem.')
    setErro(null)
    setEnviando(true)
    try {
      await confirmarRecuperacao(email, codigo, senha)
      navigation.reset({ index: 1, routes: [{ name: 'BoasVindas' }, { name: 'SenhaRedefinida' }] })
    } catch (e) {
      setErro(toApiError(e).message)
      setEnviando(false)
    }
  }

  return (
    <AuthLayout title="Nova senha" subtitle={`Digite o código enviado para ${email} e escolha uma nova senha.`}>
      <CodigoInput value={codigo} onChange={setCodigo} />
      <View className="flex-row justify-center">
        {espera > 0 ? (
          <Text className="font-medium text-base text-ink dark:text-ink-dark">
            Reenviar código em <Text className="text-primary">{espera}</Text> s
          </Text>
        ) : (
          <Pressable onPress={reenviar} hitSlop={8}>
            <Text className="font-bold text-base text-primary">Reenviar código</Text>
          </Pressable>
        )}
      </View>
      <TextField icon={Lock} placeholder="Nova senha" value={senha} onChangeText={setSenha} secure autoComplete="new-password" />
      <TextField icon={Lock} placeholder="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} secure autoComplete="new-password" />
      <FormError message={erro} />
      <Button title="Redefinir senha" onPress={confirmar} loading={enviando} disabled={codigo.length < TAMANHO_CODIGO || !senha || !confirmacao} />
    </AuthLayout>
  )
}

export function SenhaRedefinidaScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'SenhaRedefinida'>) {
  return (
    <AuthLayout>
      <View className="flex-1 items-center justify-center gap-5">
        <View className="h-32 w-32 items-center justify-center rounded-full bg-primary/15">
          <CircleCheck size={64} color={colors.primary} />
        </View>
        <Text className="text-center font-bold text-3xl text-ink dark:text-ink-dark">Senha redefinida!</Text>
        <Text className="text-center font-medium text-base text-muted dark:text-muted-dark">
          Sua senha foi alterada. Entre de novo com a nova senha.
        </Text>
      </View>
      <Button title="Ir para o login" onPress={() => navigation.replace('Login')} />
    </AuthLayout>
  )
}

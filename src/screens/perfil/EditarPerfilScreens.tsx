import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Lock, Ruler, Target, User, Weight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { alterarSenha } from '../../api/auth'
import { atualizarPerfil, getPerfil } from '../../api/usuarios'
import { Button, Chip, ErrorState, Loading, TextField } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { toApiError } from '../../lib/api'
import { brParaIso, isoParaBr } from '../../lib/format'
import type { AppStackParams } from '../../navigation/types'
import type { Perfil } from '../../types/domain'
import { FormError } from '../auth/AuthLayout'

const GENEROS = [
  { valor: 'feminino', label: 'Feminino' },
  { valor: 'masculino', label: 'Masculino' },
  { valor: 'outro', label: 'Outro' },
] as const

const numero = (t: string): number | null => {
  const n = Number(t.replace(',', '.'))
  return t.trim() && Number.isFinite(n) ? n : null
}
const texto = (n: number | null) => (n == null ? '' : String(n).replace('.', ','))

function Rotulo({ children }: { children: string }) {
  return <Text className="-mb-3 ml-2 font-semibold text-sm text-muted dark:text-muted-dark">{children}</Text>
}

export function EditarPerfilScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'EditarPerfil'>) {
  const perfil = useQuery({ queryKey: ['perfil'], queryFn: getPerfil })
  if (perfil.isLoading) return <Loading />
  if (perfil.isError || !perfil.data) return <ErrorState message={toApiError(perfil.error).message} onRetry={() => perfil.refetch()} />
  return <FormularioPerfil perfil={perfil.data} onSalvo={() => navigation.goBack()} />
}

function FormularioPerfil({ perfil, onSalvo }: { perfil: Perfil; onSalvo: () => void }) {
  const queryClient = useQueryClient()
  const { atualizarNome } = useAuth()
  const [nome, setNome] = useState(perfil.nome)
  const [nascimento, setNascimento] = useState(isoParaBr(perfil.data_nascimento))
  const [genero, setGenero] = useState(perfil.genero)
  const [altura, setAltura] = useState(texto(perfil.altura_cm))
  const [peso, setPeso] = useState(texto(perfil.peso_kg))
  const [meta, setMeta] = useState(texto(perfil.meta_peso_kg))
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: () => {
      const dataNascimento = nascimento.trim() ? brParaIso(nascimento) : null
      if (nascimento.trim() && !dataNascimento) throw { message: 'Data de nascimento no formato dd/mm/aaaa.' }
      // PUT substitui o perfil: campos não exibidos aqui vão com o valor atual para não serem apagados.
      return atualizarPerfil({
        nome: nome.trim(),
        data_nascimento: dataNascimento,
        genero,
        altura_cm: numero(altura),
        peso_kg: numero(peso),
        meta_peso_kg: numero(meta),
        percentual_gordura_percebido: perfil.percentual_gordura_percebido,
      })
    },
    onSuccess: (atualizado) => {
      queryClient.setQueryData(['perfil'], atualizado)
      queryClient.invalidateQueries({ queryKey: ['hoje'] })
      atualizarNome(atualizado.nome)
      onSalvo()
    },
    onError: (e) => setErro(toApiError(e).message),
  })

  // Máscara simples dd/mm/aaaa.
  const mascararData = (t: string) => {
    const d = t.replace(/\D/g, '').slice(0, 8)
    setNascimento([d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/'))
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Rotulo>Nome</Rotulo>
      <TextField icon={User} value={nome} onChangeText={setNome} placeholder="Nome" />
      <Rotulo>Data de nascimento</Rotulo>
      <TextField icon={Calendar} value={nascimento} onChangeText={mascararData} placeholder="dd/mm/aaaa" keyboardType="number-pad" />
      <Rotulo>Gênero</Rotulo>
      <View className="flex-row gap-2 pt-1">
        {GENEROS.map((g) => (
          <Chip key={g.valor} label={g.label} active={genero === g.valor} onPress={() => setGenero(genero === g.valor ? null : g.valor)} />
        ))}
      </View>
      <Rotulo>Altura (cm)</Rotulo>
      <TextField icon={Ruler} value={altura} onChangeText={setAltura} placeholder="Ex.: 170" keyboardType="decimal-pad" />
      <Rotulo>Peso (kg)</Rotulo>
      <TextField icon={Weight} value={peso} onChangeText={setPeso} placeholder="Ex.: 72,5" keyboardType="decimal-pad" />
      <Rotulo>Meta de peso (kg)</Rotulo>
      <TextField icon={Target} value={meta} onChangeText={setMeta} placeholder="Ex.: 68" keyboardType="decimal-pad" />
      <FormError message={erro} />
      <Button title="Salvar" onPress={() => salvar.mutate()} loading={salvar.isPending} disabled={!nome.trim()} />
    </KeyboardAwareScrollView>
  )
}

export function AlterarSenhaScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'AlterarSenha'>) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const salvar = useMutation({
    mutationFn: () => {
      if (nova.length < 6) throw { message: 'A nova senha deve ter pelo menos 6 caracteres.' }
      if (nova !== confirmacao) throw { message: 'As senhas não conferem.' }
      // Conta criada só com Google não tem senha: senha_atual vazia vira null e o backend aceita.
      return alterarSenha(atual || null, nova)
    },
    onSuccess: () => setOk(true),
    onError: (e) => setErro(toApiError(e).message),
  })

  useEffect(() => {
    if (!ok) return
    const t = setTimeout(() => navigation.goBack(), 1200)
    return () => clearTimeout(t)
  }, [ok, navigation])

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerStyle={{ padding: 24, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <TextField icon={Lock} placeholder="Senha atual" value={atual} onChangeText={setAtual} secure autoComplete="current-password" />
      <TextField icon={Lock} placeholder="Nova senha" value={nova} onChangeText={setNova} secure autoComplete="new-password" />
      <TextField icon={Lock} placeholder="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} secure autoComplete="new-password" />
      <FormError message={erro} />
      {ok && <Text className="text-center font-bold text-base text-success">Senha alterada!</Text>}
      <Button
        title="Alterar senha"
        onPress={() => {
          setErro(null)
          salvar.mutate()
        }}
        loading={salvar.isPending}
        disabled={!nova || !confirmacao || ok}
      />
    </KeyboardAwareScrollView>
  )
}

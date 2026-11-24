import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, CircleAlert, Minus, Plus, Sparkles, Wand2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { gerarTreinosIa, getGeracao, getPlanoIa, getQuestionario, redefinirPlanoIa, salvarRespostasIa } from '../../api/ia'
import { Button, EmptyState, ErrorState, Loading, OptionCard } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { toApiError } from '../../lib/api'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import type { PerguntaIa, RespostaIa } from '../../types/ia'

function respondida(p: PerguntaIa, r: RespostaIa | undefined): boolean {
  if (!p.obrigatoria) return true
  if (r == null) return false
  if (Array.isArray(r)) return r.length > 0
  return r !== ''
}

/**
 * Questionário da IA (telas 6–13 do kit: uma pergunta por etapa, barra de progresso, Continuar). As perguntas vêm do
 * backend (GET /ia/questionario), já pré-preenchidas com o perfil.
 */
export function IaQuestionarioScreen({ navigation, route }: NativeStackScreenProps<AppStackParams, 'IaQuestionario'>) {
  const editar = route.params?.modo === 'editar'
  const queryClient = useQueryClient()
  const questionario = useQuery({ queryKey: ['ia-questionario'], queryFn: getQuestionario, staleTime: 0 })
  const [etapa, setEtapa] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, RespostaIa>>({})
  const [erro, setErro] = useState<string | null>(null)
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (questionario.data) setRespostas(Object.fromEntries(questionario.data.perguntas.map((p) => [p.id, p.resposta])))
  }, [questionario.data])

  const gerar = useMutation({
    mutationFn: () => gerarTreinosIa(respostas),
    onSuccess: (g) => navigation.replace('IaGerando', { geracaoId: g.geracao_id }),
    onError: (e) => {
      const err = toApiError(e)
      const emAndamento = err.status === 409 ? (err.data?.geracao_id as string | undefined) : undefined
      if (emAndamento) navigation.replace('IaGerando', { geracaoId: emAndamento })
      else setErro(err.message)
    },
  })

  const salvar = useMutation({
    mutationFn: () => salvarRespostasIa(respostas),
    onSuccess: (q) => {
      queryClient.setQueryData(['ia-questionario'], q)
      navigation.goBack()
    },
    onError: (e) => setErro(toApiError(e).message),
  })

  if (questionario.isLoading) return <Loading />
  if (questionario.isError || !questionario.data) return <ErrorState message={toApiError(questionario.error).message} onRetry={() => questionario.refetch()} />

  const perguntas = questionario.data.perguntas
  const p = perguntas[etapa]
  const ultima = etapa === perguntas.length - 1
  const resposta = respostas[p.id]
  const definir = (v: RespostaIa) => setRespostas((r) => ({ ...r, [p.id]: v }))

  const avancar = () => {
    setErro(null)
    if (!respondida(p, resposta)) return setErro('Responda para continuar.')
    if (ultima) (editar ? salvar : gerar).mutate()
    else setEtapa((e) => e + 1)
  }

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center gap-4 px-6 pb-2 pt-2">
        <Pressable onPress={() => (etapa ? setEtapa((e) => e - 1) : navigation.goBack())} hitSlop={10} accessibilityLabel="Voltar">
          <ArrowLeft size={26} color={palette.ink} />
        </Pressable>
        <View className="h-3 flex-1 overflow-hidden rounded-full bg-surface dark:bg-surface-dark">
          <View className="h-3 rounded-full bg-primary" style={{ width: `${((etapa + 1) / perguntas.length) * 100}%` }} />
        </View>
        <Text className="font-semibold text-sm text-muted dark:text-muted-dark">
          {etapa + 1}/{perguntas.length}
        </Text>
      </View>

      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 140 }}>
        <Text className="text-center font-bold text-3xl text-ink dark:text-ink-dark">{p.titulo}</Text>
        {p.descricao && <Text className="text-center font-medium text-base text-muted dark:text-muted-dark">{p.descricao}</Text>}
        {!p.obrigatoria && <Text className="text-center font-medium text-sm text-muted dark:text-muted-dark">Opcional</Text>}
        <View className="mt-4 gap-3">
          <Campo pergunta={p} valor={resposta} onChange={definir} />
        </View>
        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
      </KeyboardAwareScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-edge bg-background px-6 pb-8 pt-4 dark:border-edge-dark dark:bg-background-dark">
        <Button
          title={ultima ? (editar ? 'Salvar respostas' : 'Gerar meus treinos') : 'Continuar'}
          icon={ultima && !editar ? Sparkles : undefined}
          onPress={avancar}
          loading={gerar.isPending || salvar.isPending}
        />
      </View>
    </View>
  )
}

function Campo({ pergunta: p, valor, onChange }: { pergunta: PerguntaIa; valor: RespostaIa | undefined; onChange: (v: RespostaIa) => void }) {
  const { palette } = useTheme()
  if (p.tipo === 'unica')
    return (
      <>
        {p.opcoes.map((o) => (
          <OptionCard key={o.valor} label={o.label} selected={valor === o.valor} onPress={() => onChange(valor === o.valor && !p.obrigatoria ? null : o.valor)} />
        ))}
      </>
    )
  if (p.tipo === 'multipla') {
    const lista = Array.isArray(valor) ? valor : []
    return (
      <>
        {p.opcoes.map((o) => (
          <OptionCard
            key={o.valor}
            multi
            label={o.label}
            selected={lista.includes(o.valor)}
            onPress={() => onChange(lista.includes(o.valor) ? lista.filter((x) => x !== o.valor) : [...lista, o.valor])}
          />
        ))}
        {!p.obrigatoria && <OptionCard multi label="Nenhum" selected={lista.length === 0} onPress={() => onChange([])} />}
      </>
    )
  }
  if (p.tipo === 'numero') {
    const min = p.min ?? 1
    const max = p.max ?? 7
    const n = typeof valor === 'number' ? valor : min
    return (
      <View className="flex-row items-center justify-center gap-8 py-6">
        <Pressable onPress={() => onChange(Math.max(min, n - 1))} className="h-16 w-16 items-center justify-center rounded-full bg-surface dark:bg-surface-dark" accessibilityLabel="Menos">
          <Minus size={28} color={colors.primary} />
        </Pressable>
        <Text className="w-24 text-center font-bold text-6xl text-primary">{typeof valor === 'number' ? valor : '–'}</Text>
        <Pressable onPress={() => onChange(Math.min(max, typeof valor === 'number' ? n + 1 : min))} className="h-16 w-16 items-center justify-center rounded-full bg-surface dark:bg-surface-dark" accessibilityLabel="Mais">
          <Plus size={28} color={colors.primary} />
        </Pressable>
      </View>
    )
  }
  const texto = typeof valor === 'string' ? valor : ''
  return (
    <View className="gap-1">
      <TextInput
        value={texto}
        onChangeText={(t) => onChange(t)}
        multiline
        maxLength={p.max ?? 300}
        placeholder="Ex.: tenho pouco tempo na sexta, prefiro treinos curtos"
        placeholderTextColor={palette.muted}
        className="min-h-32 rounded-2xl bg-surface p-4 font-semibold text-base text-ink dark:bg-surface-dark dark:text-ink-dark"
        textAlignVertical="top"
      />
      <Text className="text-right font-medium text-xs text-muted dark:text-muted-dark">
        {texto.length}/{p.max ?? 300}
      </Text>
    </View>
  )
}

const DICAS = ['Analisando seu perfil…', 'Escolhendo exercícios do catálogo…', 'Respeitando seus equipamentos e lesões…', 'Distribuindo os treinos na semana…']

/** Acompanha a geração (polling de GET /ia/geracoes/{id}) até concluir ou falhar. */
export function IaGerandoScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'IaGerando'>) {
  const queryClient = useQueryClient()
  const [dica, setDica] = useState(0)
  const geracao = useQuery({
    queryKey: ['ia-geracao', route.params.geracaoId],
    queryFn: () => getGeracao(route.params.geracaoId),
    refetchInterval: (q) => (q.state.data?.status === 'PENDENTE' || !q.state.data ? 2500 : false),
  })
  const status = geracao.data?.status

  useEffect(() => {
    const t = setInterval(() => setDica((d) => (d + 1) % DICAS.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (status === 'CONCLUIDA') {
      queryClient.invalidateQueries({ queryKey: ['treinos'] })
      queryClient.invalidateQueries({ queryKey: ['hoje'] })
      queryClient.invalidateQueries({ queryKey: ['plano-ia'] })
    }
  }, [status, queryClient])

  if (geracao.isError) return <ErrorState message={toApiError(geracao.error).message} onRetry={() => geracao.refetch()} />

  if (status === 'FALHOU')
    return (
      <View className="flex-1 justify-center bg-background p-6 dark:bg-background-dark">
        <EmptyState
          icon={CircleAlert}
          title="Não deu certo desta vez"
          message={geracao.data?.erro ?? 'A IA não conseguiu montar seus treinos.'}
          action={
            <View className="gap-3">
              <Button title="Tentar de novo" onPress={() => navigation.replace('IaQuestionario')} />
              <Button title="Voltar" variant="secondary" onPress={() => navigation.popToTop()} />
            </View>
          }
        />
      </View>
    )

  if (status === 'CONCLUIDA')
    return (
      <View className="flex-1 justify-center gap-6 bg-background p-6 dark:bg-background-dark">
        <LinearGradient colors={[colors.primary, '#9C8BFA']} style={{ borderRadius: 32, padding: 28, alignItems: 'center', gap: 10 }}>
          <Sparkles size={48} color="#fff" />
          <Text className="font-bold text-3xl text-white">Treinos prontos!</Text>
          <Text className="text-center font-semibold text-base text-white/90">Seu plano já está em Treinos da IA e aparece na tela Hoje nos dias marcados.</Text>
        </LinearGradient>
        <Button title="Ver meus treinos da IA" onPress={() => navigation.navigate('Tabs', { screen: 'Treinos' })} />
      </View>
    )

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background p-8 dark:bg-background-dark">
      <View className="h-28 w-28 items-center justify-center rounded-full bg-primary/15">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text className="text-center font-bold text-2xl text-ink dark:text-ink-dark">Montando seus treinos</Text>
      <Text className="text-center font-medium text-base text-muted dark:text-muted-dark">{DICAS[dica]}</Text>
      <Text className="text-center font-medium text-sm text-muted dark:text-muted-dark">Isso leva até um minuto. Pode sair desta tela: o plano aparece em Treinos quando ficar pronto.</Text>
    </View>
  )
}

/** Pedido de ajuste ao plano da IA (regra 11: limitado por plano). */
export function IaRedefinirScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'IaRedefinir'>) {
  const { planoId } = route.params
  const { palette } = useTheme()
  const [pedido, setPedido] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const plano = useQuery({ queryKey: ['plano-ia', planoId], queryFn: () => getPlanoIa(planoId) })

  const enviar = useMutation({
    mutationFn: () => redefinirPlanoIa(planoId, pedido.trim()),
    onSuccess: (g) => navigation.replace('IaGerando', { geracaoId: g.geracao_id }),
    onError: (e) => {
      const err = toApiError(e)
      const emAndamento = err.status === 409 ? (err.data?.geracao_id as string | undefined) : undefined
      if (emAndamento) navigation.replace('IaGerando', { geracaoId: emAndamento })
      else setErro(err.message)
    },
  })

  if (plano.isLoading) return <Loading />
  if (plano.isError || !plano.data) return <ErrorState message={toApiError(plano.error).message} onRetry={() => plano.refetch()} />
  const restantes = plano.data.redefinicoes_restantes

  return (
    <KeyboardAwareScrollView className="flex-1 bg-background dark:bg-background-dark" bottomOffset={24} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className="items-center gap-3">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/15">
          <Wand2 size={36} color={colors.primary} />
        </View>
        <Text className="text-center font-bold text-2xl text-ink dark:text-ink-dark">O que você quer ajustar?</Text>
        <Text className="text-center font-medium text-base text-muted dark:text-muted-dark">
          A IA refaz o plano a partir do atual e do seu pedido. {restantes > 0 ? `Você tem ${restantes} ajuste${restantes > 1 ? 's' : ''} para este plano.` : 'Você já usou o ajuste deste plano.'}
        </Text>
      </View>
      {restantes > 0 ? (
        <>
          <TextInput
            value={pedido}
            onChangeText={setPedido}
            multiline
            maxLength={300}
            placeholder="Ex.: quero treinar só 3 vezes por semana e mais foco em pernas"
            placeholderTextColor={palette.muted}
            className="min-h-36 rounded-2xl bg-surface p-4 font-semibold text-base text-ink dark:bg-surface-dark dark:text-ink-dark"
            textAlignVertical="top"
          />
          <Text className="text-right font-medium text-xs text-muted dark:text-muted-dark">{pedido.length}/300</Text>
          {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
          <Button title="Pedir ajuste" icon={Sparkles} onPress={() => enviar.mutate()} disabled={pedido.trim().length < 5} loading={enviar.isPending} />
        </>
      ) : (
        <View className="gap-3">
          <Button title="Responder o questionário de novo" onPress={() => navigation.replace('IaQuestionario')} />
          <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      )}
    </KeyboardAwareScrollView>
  )
}

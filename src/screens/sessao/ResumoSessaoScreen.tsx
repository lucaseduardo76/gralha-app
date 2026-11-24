import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { ChartLine, Clock, Dumbbell, Flame, HeartPulse, Repeat, Trophy } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { avaliarSessao, registrarDor } from '../../api/avaliacoes'
import { finalizarSessao } from '../../api/sessoes'
import { CardAvaliacaoSessao, SeletorDor } from '../../components/avaliacoes'
import { Button, ErrorState, Loading, OptionCard, SectionHeader } from '../../components/ui'
import { toApiError } from '../../lib/api'
import { kg } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import { LIMITE_DOR, type DorSessaoResposta } from '../../types/avaliacoes'
import type { ItemSnapshot } from '../../types/sessoes'

/** "Parabéns!" depois de finalizar (tela "Congratulations" do kit). Finalizar é idempotente: sem cache, busca de novo. */
export function ResumoSessaoScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'ResumoSessao'>) {
  const { sessaoId } = route.params
  const resumo = useQuery({ queryKey: ['resumo-sessao', sessaoId], queryFn: () => finalizarSessao(sessaoId), staleTime: Infinity })

  if (resumo.isLoading) return <Loading />
  if (resumo.isError || !resumo.data) return <ErrorState message={toApiError(resumo.error).message} onRetry={() => resumo.refetch()} />
  const r = resumo.data

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}>
      <LinearGradient colors={[colors.primary, '#9C8BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 28, gap: 8, alignItems: 'center' }}>
        <Text className="text-5xl">🎉</Text>
        <Text className="font-bold text-3xl text-white">Parabéns!</Text>
        <Text className="text-center font-semibold text-base text-white/90">Você concluiu {r.sessao.nome_treino}.</Text>
      </LinearGradient>

      <View className="flex-row gap-3">
        <Metrica icon={<Flame size={22} color={colors.primary} />} valor={`${kg(r.volume_total_kg)} kg`} rotulo="Volume" />
        <Metrica icon={<Clock size={22} color={colors.primary} />} valor={`${r.sessao.duracao_min ?? '–'} min`} rotulo="Duração" />
      </View>
      <View className="flex-row gap-3">
        <Metrica icon={<Dumbbell size={22} color={colors.primary} />} valor={String(r.series_concluidas)} rotulo="Séries" />
        <Metrica icon={<ChartLine size={22} color={colors.primary} />} valor={String(r.exercicios_feitos)} rotulo="Exercícios" />
      </View>

      {r.novos_recordes.length > 0 && (
        <View className="gap-3">
          <SectionHeader title="Novos recordes 🏆" />
          {r.novos_recordes.map((rec) => (
            <View key={rec.id} className="flex-row items-center gap-4 rounded-2xl bg-surface p-4 dark:bg-surface-dark">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-warning/20">
                <Trophy size={22} color={colors.warning} />
              </View>
              <Text className="flex-1 font-bold text-base text-ink dark:text-ink-dark">{rec.exercicio.nome}</Text>
              <Text className="font-bold text-lg text-primary">
                {kg(rec.valor_recorde)} {rec.unidade}
              </Text>
            </View>
          ))}
        </View>
      )}

      <PosTreino sessaoId={sessaoId} itens={r.sessao.itens} />

      {r.sessao.treino_id && (
        <Button title="Ver resultados do treino" variant="secondary" icon={ChartLine} onPress={() => navigation.replace('Resultados', { treinoId: r.sessao.treino_id!, nome: r.sessao.nome_treino })} />
      )}
      <Button title="Concluir" onPress={() => navigation.popToTop()} />
    </ScrollView>
  )
}

function Metrica({ icon, valor, rotulo }: { icon: ReactNode; valor: string; rotulo: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
      {icon}
      <Text className="font-bold text-2xl text-ink dark:text-ink-dark">{valor}</Text>
      <Text className="font-medium text-sm text-muted dark:text-muted-dark">{rotulo}</Text>
    </View>
  )
}

/**
 * Pós-treino: pergunta a dor (0-10). Acima de 5 pede os exercícios que mais doeram, que o backend troca no treino por
 * substitutos mais adequados (ou retira). Depois mostra a avaliação da IA sobre o treino.
 */
function PosTreino({ sessaoId, itens }: { sessaoId: string; itens: ItemSnapshot[] }) {
  const queryClient = useQueryClient()
  const [nivel, setNivel] = useState<number | null>(null)
  const [etapa, setEtapa] = useState<'dor' | 'exercicios' | 'feito'>('dor')
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [resultado, setResultado] = useState<DorSessaoResposta | null>(null)

  const dor = useMutation({
    mutationFn: (ids: string[]) => registrarDor(sessaoId, nivel ?? 0, ids),
    onSuccess: (r) => {
      setResultado(r)
      setEtapa('feito')
      if (r.substituicoes.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['treinos'] })
        queryClient.invalidateQueries({ queryKey: ['treino'] })
        queryClient.invalidateQueries({ queryKey: ['hoje'] })
      }
    },
    onError: (e) => {
      if (toApiError(e).status === 409) setEtapa('feito') // dor já informada antes (ex.: reabriu a tela)
    },
  })
  const avaliacao = useQuery({
    queryKey: ['avaliacao-sessao', sessaoId],
    queryFn: () => avaliarSessao(sessaoId),
    enabled: etapa === 'feito',
    staleTime: Infinity,
    retry: false,
  })

  function enviarNivel() {
    if (nivel === null) return
    if (nivel > LIMITE_DOR) setEtapa('exercicios')
    else dor.mutate([])
  }

  const alternar = (id: string) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const erroDor = dor.isError && toApiError(dor.error).status !== 409 ? toApiError(dor.error).message : null

  return (
    <View className="gap-4">
      {etapa === 'dor' && (
        <View className="gap-4 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
          <View className="flex-row items-center gap-2">
            <HeartPulse size={20} color={colors.primary} />
            <Text className="font-bold text-lg text-ink dark:text-ink-dark">Como ficou a dor neste treino?</Text>
          </View>
          <Text className="text-sm text-muted dark:text-muted-dark">De 0 (nenhuma) a 10 (dor máxima). Considere dor nas articulações ou fora do normal, não o cansaço muscular.</Text>
          <SeletorDor valor={nivel} onChange={setNivel} />
          {erroDor ? <Text className="text-sm text-danger">{erroDor}</Text> : null}
          <Button title="Continuar" onPress={enviarNivel} disabled={nivel === null} loading={dor.isPending} />
        </View>
      )}

      {etapa === 'exercicios' && (
        <View className="gap-4 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
          <Text className="font-bold text-lg text-ink dark:text-ink-dark">Quais exercícios causaram mais dor?</Text>
          <Text className="text-sm text-muted dark:text-muted-dark">
            Vamos trocá-los no seu treino por opções mais adequadas para os mesmos músculos.
          </Text>
          <View className="gap-2">
            {itens.map((item) => (
              <OptionCard key={item.exercicio_id} label={item.nome} multi selected={selecionados.includes(item.exercicio_id)} onPress={() => alternar(item.exercicio_id)} />
            ))}
          </View>
          {erroDor ? <Text className="text-sm text-danger">{erroDor}</Text> : null}
          <Button title="Trocar exercícios" onPress={() => dor.mutate(selecionados)} disabled={selecionados.length === 0} loading={dor.isPending} />
          <Button title="Voltar" variant="secondary" onPress={() => setEtapa('dor')} />
        </View>
      )}

      {etapa === 'feito' && resultado && resultado.substituicoes.length > 0 && (
        <View className="gap-3 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
          <View className="flex-row items-center gap-2">
            <Repeat size={20} color={colors.primary} />
            <Text className="font-bold text-lg text-ink dark:text-ink-dark">Seu treino foi ajustado</Text>
          </View>
          {resultado.substituicoes.map((s) => (
            <View key={s.exercicio_id} className="gap-1">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                {s.substituto_nome ? `${s.exercicio_nome} → ${s.substituto_nome}` : s.exercicio_nome}
              </Text>
              <Text className="text-sm text-muted dark:text-muted-dark">{s.motivo}</Text>
            </View>
          ))}
          {resultado.nivel_dor >= 7 && (
            <Text className="text-sm text-warning">Dor alta: se ela continuar nos próximos dias, procure um profissional de saúde.</Text>
          )}
        </View>
      )}

      {etapa === 'feito' && (
        <>
          {avaliacao.isLoading && (
            <View className="flex-row items-center gap-3 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
              <ActivityIndicator color={colors.primary} />
              <Text className="flex-1 text-base text-ink dark:text-ink-dark">A IA está analisando o seu treino…</Text>
            </View>
          )}
          {avaliacao.isError && (
            <View className="gap-3 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
              <Text className="text-base text-ink dark:text-ink-dark">{toApiError(avaliacao.error).message}</Text>
              <Button title="Tentar de novo" variant="secondary" small onPress={() => avaliacao.refetch()} />
            </View>
          )}
          {avaliacao.data && <CardAvaliacaoSessao avaliacao={avaliacao.data.avaliacao} />}
        </>
      )}
    </View>
  )
}

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { getResultados, getSessao } from '../../api/sessoes'
import { Grafico } from '../../components/Grafico'
import { Chip, ErrorState, Loading, SectionHeader } from '../../components/ui'
import { toApiError } from '../../lib/api'
import { dataCurta, kg } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import type { Periodo, PontoResultado } from '../../types/sessoes'

type MetricaGrafico = 'carga_maxima_kg' | 'volume_kg' | 'e1rm_kg'
const METRICAS: { chave: MetricaGrafico; label: string }[] = [
  { chave: 'carga_maxima_kg', label: 'Carga máx.' },
  { chave: 'volume_kg', label: 'Volume' },
  { chave: 'e1rm_kg', label: '1RM estimado' },
]
const PERIODOS: { chave: Periodo; label: string }[] = [
  { chave: '30d', label: '30 dias' },
  { chave: '90d', label: '90 dias' },
  { chave: '180d', label: '6 meses' },
  { chave: '1a', label: '1 ano' },
  { chave: 'tudo', label: 'Tudo' },
]
const VAZIO = 'Faça o primeiro treino para ver sua evolução'

/** Resultados do treino (regras 8 e 9): evolução por exercício, volume por sessão e histórico. */
export function ResultadosScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'Resultados'>) {
  const { treinoId, nome } = route.params
  const [periodo, setPeriodo] = useState<Periodo>('90d')
  const [exercicioId, setExercicioId] = useState<string | null>(null)
  const [metrica, setMetrica] = useState<MetricaGrafico>('carga_maxima_kg')

  useEffect(() => navigation.setOptions({ title: `Resultados · ${nome}` }), [navigation, nome])

  const resultados = useQuery({
    queryKey: ['resultados', treinoId, periodo],
    queryFn: () => getResultados(treinoId, periodo),
    placeholderData: (anterior) => anterior,
  })
  const dados = resultados.data
  const selecionado = exercicioId ?? dados?.exercicios[0]?.id ?? null
  const exercicio = dados?.exercicios.find((e) => e.id === selecionado)
  const pesoReps = exercicio?.metrica === 'peso_reps'

  const pontos = useMemo(() => {
    const serie = dados?.series_por_exercicio.find((s) => s.exercicio_id === selecionado)
    const chave: keyof PontoResultado = pesoReps ? metrica : 'series'
    return (serie?.pontos ?? []).map((p) => ({ rotulo: dataCurta(p.data), valor: p[chave] as number | null }))
  }, [dados, selecionado, metrica, pesoReps])
  const volumes = useMemo(() => (dados?.volume_total_por_sessao ?? []).map((v) => ({ rotulo: dataCurta(v.data), valor: v.volume_kg })), [dados])

  if (resultados.isLoading) return <Loading />
  if (resultados.isError || !dados) return <ErrorState message={toApiError(resultados.error).message} onRetry={() => resultados.refetch()} />

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerStyle={{ paddingVertical: 16, gap: 20, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={resultados.isRefetching} onRefresh={() => { void resultados.refetch() }} tintColor={colors.primary} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
        {PERIODOS.map((p) => (
          <Chip key={p.chave} label={p.label} active={periodo === p.chave} onPress={() => setPeriodo(p.chave)} />
        ))}
      </ScrollView>

      <View className="mx-6 gap-4 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
        <Text className="font-bold text-lg text-ink dark:text-ink-dark">Evolução por exercício</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {dados.exercicios.map((e) => (
            <Chip key={e.id} label={e.nome} active={selecionado === e.id} onPress={() => setExercicioId(e.id)} />
          ))}
        </ScrollView>
        {pesoReps && (
          <View className="flex-row rounded-full bg-background p-1 dark:bg-background-dark">
            {METRICAS.map((m) => (
              <Pressable key={m.chave} onPress={() => setMetrica(m.chave)} className={`h-9 flex-1 items-center justify-center rounded-full ${metrica === m.chave ? 'bg-primary' : ''}`}>
                <Text className={`font-bold text-xs ${metrica === m.chave ? 'text-white' : 'text-muted dark:text-muted-dark'}`}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Grafico pontos={pontos} tipo="linha" unidade={pesoReps ? 'kg' : 'séries'} vazio={VAZIO} />
        {metrica === 'e1rm_kg' && pesoReps && (
          <Text className="font-medium text-xs text-muted dark:text-muted-dark">1RM estimado pela fórmula de Epley: carga × (1 + reps/30), melhor série da sessão.</Text>
        )}
      </View>

      <View className="mx-6 gap-3 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
        <Text className="font-bold text-lg text-ink dark:text-ink-dark">Volume total por sessão</Text>
        <Grafico pontos={volumes} tipo="barras" unidade="kg" vazio={VAZIO} />
      </View>

      <View className="gap-3 px-6">
        <SectionHeader title="Exercícios do treino" />
        {dados.exercicios.map((e) => (
          <Pressable key={e.id} onPress={() => navigation.navigate('ExercicioDetalhe', { id: e.id, nome: e.nome })} className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3 dark:bg-surface-dark">
            <Text className="flex-1 font-semibold text-base text-ink dark:text-ink-dark">{e.nome}</Text>
            {!e.no_treino_atual && <Text className="mr-2 font-semibold text-xs text-muted dark:text-muted-dark">removido do treino</Text>}
            <ChevronRight size={18} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <View className="gap-3 px-6">
        <SectionHeader title={`Histórico (${dados.sessoes.length})`} />
        {dados.sessoes.length === 0 ? (
          <Text className="font-medium text-base text-muted dark:text-muted-dark">{VAZIO}.</Text>
        ) : (
          dados.sessoes.map((s) => (
            <Pressable key={s.id} onPress={() => navigation.navigate('SessaoDetalhe', { id: s.id })} className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 dark:bg-surface-dark">
              <View className="flex-1">
                <Text className="font-bold text-base text-ink dark:text-ink-dark">{new Date(s.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                <Text className="font-medium text-sm text-muted dark:text-muted-dark">
                  {s.series.length} séries · {kg(s.volume_kg)} kg{s.duracao_min ? ` · ${s.duracao_min} min` : ''}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  )
}

/** Detalhe de uma sessão: o que foi planejado e as séries feitas. */
export function SessaoDetalheScreen({ route }: NativeStackScreenProps<AppStackParams, 'SessaoDetalhe'>) {
  const sessao = useQuery({ queryKey: ['sessao', route.params.id], queryFn: () => getSessao(route.params.id) })
  if (sessao.isLoading) return <Loading />
  if (sessao.isError || !sessao.data) return <ErrorState message={toApiError(sessao.error).message} onRetry={() => sessao.refetch()} />
  const s = sessao.data
  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 48 }}>
      <Text className="font-bold text-2xl text-ink dark:text-ink-dark">{s.nome_treino}</Text>
      <Text className="font-medium text-base text-muted dark:text-muted-dark">
        {new Date(s.finalizada_em ?? s.iniciada_em).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })}
        {s.duracao_min ? ` · ${s.duracao_min} min` : ''}
      </Text>
      {s.itens.map((item) => {
        const feitas = s.series.filter((x) => x.exercicio_id === item.exercicio_id)
        return (
          <View key={item.exercicio_id + item.ordem} className="gap-2 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
            <Text className="font-bold text-base text-ink dark:text-ink-dark">{item.nome}</Text>
            {feitas.length === 0 ? (
              <Text className="font-medium text-sm text-muted dark:text-muted-dark">Não realizado</Text>
            ) : (
              feitas.map((f) => (
                <View key={f.numero_serie} className="flex-row justify-between">
                  <Text className="font-semibold text-sm text-muted dark:text-muted-dark">Série {f.numero_serie}</Text>
                  <Text className={`font-bold text-sm ${f.concluida ? 'text-ink dark:text-ink-dark' : 'text-muted dark:text-muted-dark'}`}>
                    {item.metrica === 'peso_reps'
                      ? `${f.carga_kg != null ? `${kg(f.carga_kg)} kg × ` : ''}${f.repeticoes ?? '–'} reps`
                      : item.metrica === 'sustentacao'
                        ? `${f.duracao_seg ?? '–'} s`
                        : `${f.distancia_km ?? '–'} km · ${f.duracao_seg ?? '–'} s`}
                    {f.concluida ? '' : ' (não concluída)'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

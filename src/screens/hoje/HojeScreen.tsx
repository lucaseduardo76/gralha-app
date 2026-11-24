import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { CalendarX2, ChartLine, CircleCheck, Play, Timer, Trophy } from 'lucide-react-native'
import { useCallback } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { getHojeTreinos } from '../../api/sessoes'
import { ItemTreinoLinha } from '../../components/treinos'
import { AppHeader, Button, EmptyState, ErrorState, Loading, Screen, SectionHeader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { toApiError } from '../../lib/api'
import { dataCurta, DIA_SEMANA_LONGO, kg, primeiroNome, saudacao } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams, TabsParams } from '../../navigation/types'
import type { Treino } from '../../types/treinos'
import type { UltimoResultado } from '../../types/sessoes'

type Props = CompositeScreenProps<BottomTabScreenProps<TabsParams, 'Hoje'>, NativeStackScreenProps<AppStackParams>>

/**
 * Treino do dia (D-T3): os treinos com o dia de hoje na agenda. 0 → escolher da lista; 2+ → o usuário escolhe (manual ×
 * IA no mesmo dia é permitido). Sessão em andamento aparece no topo para retomar.
 */
export function HojeScreen({ navigation }: Props) {
  const { usuario } = useAuth()
  const hoje = useQuery({ queryKey: ['hoje'], queryFn: getHojeTreinos })
  const { refetch } = hoje

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch]),
  )

  const dados = hoje.data
  return (
    <Screen>
      <AppHeader title="GralhaFit" />
      {hoje.isLoading ? (
        <Loading />
      ) : hoje.isError || !dados ? (
        <ErrorState message={toApiError(hoje.error).message} onRetry={() => hoje.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={hoje.isRefetching} onRefresh={() => { void hoje.refetch() }} tintColor={colors.primary} />}
        >
          <View className="gap-1">
            <Text className="font-bold text-3xl text-ink dark:text-ink-dark">
              {saudacao()}, {primeiroNome(usuario?.nome)} 👋
            </Text>
            <Text className="font-semibold text-base text-muted dark:text-muted-dark">
              {DIA_SEMANA_LONGO[dados.dia_semana]} · {dados.sessoes_na_semana} treino{dados.sessoes_na_semana === 1 ? '' : 's'} nesta semana
            </Text>
          </View>

          {dados.sessao_em_andamento && (
            <Pressable onPress={() => navigation.navigate('Sessao', {})} className="flex-row items-center gap-4 rounded-3xl border-2 border-primary bg-primary/10 p-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Timer size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base text-ink dark:text-ink-dark">Treino em andamento</Text>
                <Text className="font-medium text-sm text-muted dark:text-muted-dark">{dados.sessao_em_andamento.nome_treino} · toque para continuar</Text>
              </View>
            </Pressable>
          )}

          {dados.treinos_do_dia.length === 0 ? (
            <View className="rounded-3xl bg-surface dark:bg-surface-dark">
              <EmptyState
                icon={CalendarX2}
                title="Nenhum treino para hoje"
                message="Marque os dias da semana nos seus treinos para eles aparecerem aqui, ou escolha um treino agora."
                action={<Button title="Escolher um treino" onPress={() => navigation.navigate('Tabs', { screen: 'Treinos' })} />}
              />
            </View>
          ) : (
            <>
              {dados.treinos_do_dia.length > 1 && (
                <Text className="font-semibold text-base text-muted dark:text-muted-dark">Você tem {dados.treinos_do_dia.length} treinos para hoje. Escolha qual fazer:</Text>
              )}
              {dados.treinos_do_dia.map(({ treino, concluido_hoje, ultima_sessao_em }) => (
                <TreinoDoDia
                  key={treino.id}
                  treino={treino}
                  concluido={concluido_hoje}
                  ultimaSessao={ultima_sessao_em}
                  ultimos={dados.ultimo_resultado_por_exercicio}
                  bloqueado={!!dados.sessao_em_andamento}
                  onIniciar={() => navigation.navigate('Sessao', { treinoId: treino.id })}
                  onResultados={() => navigation.navigate('Resultados', { treinoId: treino.id, nome: treino.nome })}
                  onDetalhe={() => navigation.navigate('TreinoDetalhe', { id: treino.id })}
                />
              ))}
            </>
          )}

          {!!dados.recordes_recentes.length && (
            <View className="gap-4">
              <SectionHeader title="Recordes recentes" />
              {dados.recordes_recentes.slice(0, 3).map((r) => (
                <View key={r.id} className="flex-row items-center gap-4 rounded-2xl bg-surface p-4 dark:bg-surface-dark">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-warning/20">
                    <Trophy size={22} color={colors.warning} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-base text-ink dark:text-ink-dark">{r.exercicio.nome}</Text>
                    <Text className="font-medium text-sm text-muted dark:text-muted-dark">{dataCurta(r.data_recorde)}</Text>
                  </View>
                  <Text className="font-bold text-lg text-primary">
                    {kg(r.valor_recorde)} {r.unidade}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  )
}

function TreinoDoDia({
  treino,
  concluido,
  ultimaSessao,
  ultimos,
  bloqueado,
  onIniciar,
  onResultados,
  onDetalhe,
}: {
  treino: Treino
  concluido: boolean
  ultimaSessao: string | null
  ultimos: Record<string, UltimoResultado>
  bloqueado: boolean
  onIniciar: () => void
  onResultados: () => void
  onDetalhe: () => void
}) {
  return (
    <View className="gap-4">
      <Pressable onPress={onDetalhe}>
        <LinearGradient colors={[colors.primary, '#9C8BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 24, gap: 12 }}>
          <Text className="font-semibold text-sm uppercase tracking-widest text-white/80">Treino de hoje</Text>
          <Text className="font-bold text-3xl text-white">{treino.nome}</Text>
          <View className="flex-row flex-wrap gap-2">
            <Tag label={treino.editavel ? 'Manual' : '✦ IA'} />
            <Tag label={`${treino.itens.length} exercícios`} />
            {concluido && <Tag label="Concluído hoje ✓" />}
            {!concluido && ultimaSessao && <Tag label={`Último: ${dataCurta(ultimaSessao)}`} />}
          </View>
        </LinearGradient>
      </Pressable>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button title={concluido ? 'Treinar de novo' : 'Iniciar'} icon={concluido ? CircleCheck : Play} onPress={onIniciar} disabled={bloqueado || !treino.itens.length} />
        </View>
        <View className="flex-1">
          <Button title="Resultados" icon={ChartLine} variant="secondary" onPress={onResultados} />
        </View>
      </View>
      {treino.itens.map((item, i) => {
        const u = ultimos[item.exercicio.id]
        const max = u ? Math.max(...u.series.map((s) => s.carga_kg ?? 0)) : 0
        return (
          <ItemTreinoLinha
            key={item.id}
            item={item}
            posicao={i + 1}
            direita={
              u ? (
                <Text className="w-20 text-right font-semibold text-xs text-primary">
                  Última:{'\n'}
                  {u.series.length}×{Math.max(...u.series.map((s) => s.repeticoes ?? 0))}
                  {max ? ` @${kg(max)}` : ''}
                </Text>
              ) : undefined
            }
          />
        )
      })}
    </View>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-white/60 px-3 py-1">
      <Text className="font-semibold text-xs text-white">{label}</Text>
    </View>
  )
}

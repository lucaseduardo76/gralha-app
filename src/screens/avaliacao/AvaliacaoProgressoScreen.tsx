import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Sparkles } from 'lucide-react-native'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { getStatusAvaliacaoProgresso, pedirAvaliacaoProgresso } from '../../api/avaliacoes'
import { CardAvaliacaoProgresso } from '../../components/avaliacoes'
import { Button, ErrorState, Loading } from '../../components/ui'
import { toApiError } from '../../lib/api'
import { colors } from '../../lib/theme'

const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatar = (iso: string) => DATA.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso))

/** Avaliação geral de progresso pela IA: 1 a cada 30 dias, com base nos treinos dos últimos 90 dias. */
export function AvaliacaoProgressoScreen() {
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: ['avaliacao-progresso'], queryFn: getStatusAvaliacaoProgresso })
  const pedir = useMutation({
    mutationFn: pedirAvaliacaoProgresso,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avaliacao-progresso'] }),
  })

  if (status.isLoading) return <Loading />
  if (status.isError || !status.data) return <ErrorState message={toApiError(status.error).message} onRetry={() => status.refetch()} />
  const s = status.data
  const faltam = Math.max(0, s.sessoes_minimas - s.sessoes_finalizadas)

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark" contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}>
      <View className="gap-3 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
        <View className="flex-row items-center gap-2">
          <Sparkles size={20} color={colors.primary} />
          <Text className="font-bold text-lg text-ink dark:text-ink-dark">Avaliação de progresso</Text>
        </View>
        <Text className="text-base leading-6 text-muted dark:text-muted-dark">
          A IA analisa seus treinos dos últimos 90 dias — frequência, evolução de carga, volume e dores informadas — e sugere
          ajustes para o próximo mês. Você pode pedir uma avaliação a cada 30 dias.
        </Text>

        {pedir.isPending ? (
          <View className="flex-row items-center gap-3 py-2">
            <ActivityIndicator color={colors.primary} />
            <Text className="flex-1 text-base text-ink dark:text-ink-dark">Analisando o seu histórico… isso pode levar alguns segundos.</Text>
          </View>
        ) : s.disponivel ? (
          <Button title="Pedir avaliação agora" icon={Sparkles} onPress={() => pedir.mutate()} />
        ) : (
          <View className="flex-row items-center gap-3 rounded-2xl bg-background p-4 dark:bg-background-dark">
            <CalendarClock size={22} color={colors.primary} />
            <Text className="flex-1 text-sm text-ink dark:text-ink-dark">
              {s.proxima_disponivel_em
                ? `Próxima avaliação disponível em ${formatar(s.proxima_disponivel_em)}.`
                : `Finalize mais ${faltam} ${faltam === 1 ? 'treino' : 'treinos'} para liberar a avaliação (mínimo de ${s.sessoes_minimas} nos últimos 90 dias).`}
            </Text>
          </View>
        )}
        {pedir.isError ? <Text className="text-sm text-danger">{toApiError(pedir.error).message}</Text> : null}
      </View>

      {s.ultima && (
        <View className="gap-2">
          <Text className="text-sm text-muted dark:text-muted-dark">
            Feita em {formatar(s.ultima.criada_em)} · {s.ultima.sessoes_analisadas} treinos de {formatar(s.ultima.periodo_inicio)} a{' '}
            {formatar(s.ultima.periodo_fim)}
          </Text>
          <CardAvaliacaoProgresso avaliacao={s.ultima.avaliacao} />
        </View>
      )}
    </ScrollView>
  )
}

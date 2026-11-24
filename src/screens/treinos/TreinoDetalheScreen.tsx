import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { ChartLine, Copy, Pencil, Play, Trash2, Wand2 } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { getPlanoIa } from '../../api/ia'
import { copiarTreino, excluirTreino, getTreino } from '../../api/treinos'
import { BadgeOrigem, ConfirmSheet, ItemTreinoLinha } from '../../components/treinos'
import { Button, ErrorState, Loading, SectionHeader } from '../../components/ui'
import { toApiError } from '../../lib/api'
import { diasSemanaTexto, MODALIDADE_LABEL } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'

/**
 * Detalhe do treino. A mesma tela serve Meus treinos e Treinos da IA: `editavel` decide as ações
 * (editar/duplicar/excluir × copiar para Meus treinos / pedir ajuste à IA).
 */
export function TreinoDetalheScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'TreinoDetalhe'>) {
  const { id } = route.params
  const queryClient = useQueryClient()
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const treino = useQuery({ queryKey: ['treino', id], queryFn: () => getTreino(id) })
  const ia = treino.data && !treino.data.editavel
  const plano = useQuery({ queryKey: ['plano-ia', treino.data?.plano_id], queryFn: () => getPlanoIa(treino.data!.plano_id), enabled: !!ia })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['treinos'] })

  const copiar = useMutation({
    mutationFn: () => copiarTreino(id),
    onSuccess: async (copia) => {
      await invalidar()
      navigation.replace('TreinoDetalhe', { id: copia.id })
    },
    onError: (e) => setErro(toApiError(e).message),
  })

  const excluir = useMutation({
    mutationFn: () => excluirTreino(id),
    onSuccess: async () => {
      setConfirmarExclusao(false)
      await Promise.all([invalidar(), queryClient.invalidateQueries({ queryKey: ['hoje'] })])
      navigation.goBack()
    },
    onError: (e) => {
      setConfirmarExclusao(false)
      setErro(toApiError(e).message)
    },
  })

  if (treino.isLoading) return <Loading />
  if (treino.isError || !treino.data) return <ErrorState message={toApiError(treino.error).message} onRetry={() => treino.refetch()} />

  const t = treino.data
  const restantes = plano.data?.redefinicoes_restantes ?? 0

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}>
        <LinearGradient colors={[colors.primary, '#9C8BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 24, gap: 12 }}>
          <View className="self-start rounded-full bg-white/20 px-3 py-1">
            <Text className="font-bold text-xs text-white">{t.editavel ? 'Manual' : '✦ Gerado por IA'}</Text>
          </View>
          <Text className="font-bold text-3xl text-white">{t.nome}</Text>
          <Text className="font-semibold text-base text-white/90">
            {MODALIDADE_LABEL[t.modalidade]} · {t.itens.length} exercícios · {diasSemanaTexto(t.dias_semana)}
          </Text>
        </LinearGradient>

        <Button title="Iniciar treino" icon={Play} onPress={() => navigation.navigate('Sessao', { treinoId: t.id })} disabled={!t.itens.length} />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Resultados" icon={ChartLine} variant="secondary" small onPress={() => navigation.navigate('Resultados', { treinoId: t.id, nome: t.nome })} />
          </View>
          {t.editavel ? (
            <>
              <View className="flex-1">
                <Button title="Editar" icon={Pencil} variant="secondary" small onPress={() => navigation.navigate('TreinoForm', { id: t.id })} />
              </View>
              <View className="flex-1">
                <Button title="Duplicar" icon={Copy} variant="secondary" small loading={copiar.isPending} onPress={() => copiar.mutate()} />
              </View>
            </>
          ) : null}
        </View>

        {!t.editavel && (
          <View className="gap-3 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
            <BadgeOrigem origem={t.origem} />
            <Text className="font-medium text-sm text-muted dark:text-muted-dark">
              Treinos da IA não podem ser editados. Copie para Meus treinos para ajustar à vontade, ou peça um ajuste à IA.
            </Text>
            <Button title="Copiar para Meus treinos" icon={Copy} onPress={() => copiar.mutate()} loading={copiar.isPending} />
            <Button
              title={restantes > 0 ? `Pedir ajuste à IA (${restantes} restante${restantes > 1 ? 's' : ''})` : 'Ajuste à IA já utilizado'}
              icon={Wand2}
              variant="outline"
              disabled={restantes <= 0}
              onPress={() => navigation.navigate('IaRedefinir', { planoId: t.plano_id })}
            />
          </View>
        )}

        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}

        <SectionHeader title="Exercícios" />
        {t.itens.length ? (
          t.itens.map((item, i) => (
            <ItemTreinoLinha
              key={item.id}
              item={item}
              posicao={i + 1}
              onPress={() => navigation.navigate('ExercicioDetalhe', { id: item.exercicio.id, nome: item.exercicio.nome })}
            />
          ))
        ) : (
          <Text className="font-medium text-base text-muted dark:text-muted-dark">Este treino ainda não tem exercícios.</Text>
        )}

        {t.editavel && <Button title="Excluir treino" icon={Trash2} variant="outline" small onPress={() => setConfirmarExclusao(true)} />}
      </ScrollView>

      <ConfirmSheet
        visible={confirmarExclusao}
        danger
        title="Excluir treino"
        message={`Excluir "${t.nome}"? As sessões já feitas continuam no seu histórico.`}
        confirmLabel="Excluir"
        loading={excluir.isPending}
        onConfirm={() => excluir.mutate()}
        onClose={() => setConfirmarExclusao(false)}
      />
    </View>
  )
}

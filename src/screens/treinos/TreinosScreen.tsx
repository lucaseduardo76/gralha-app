import { useNavigation, type NavigationProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Plus, Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { listarTreinos } from '../../api/treinos'
import { TreinoCard } from '../../components/treinos'
import { AppHeader, Button, EmptyState, ErrorState, Loading, Screen } from '../../components/ui'
import { toApiError } from '../../lib/api'
import { diaSemanaHoje } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import type { OrigemPlano } from '../../types/domain'

type Aba = 'meus' | 'ia'
const ORIGEM: Record<Aba, OrigemPlano> = { meus: 'manual', ia: 'gerado_automatico' }

/** "Meus treinos" e "Treinos da IA": a mesma lista, filtrada pela origem; as ações dependem de `editavel`. */
export function TreinosScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParams>>()
  const [aba, setAba] = useState<Aba>('meus')
  const treinos = useQuery({ queryKey: ['treinos', ORIGEM[aba]], queryFn: () => listarTreinos(ORIGEM[aba]) })
  const hoje = diaSemanaHoje()

  return (
    <Screen>
      <AppHeader
        title="Treinos"
        right={
          aba === 'meus' ? (
            <Pressable onPress={() => navigation.navigate('TreinoForm', {})} accessibilityLabel="Novo treino" className="h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Plus size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      <View className="mx-6 mt-4 flex-row rounded-full bg-surface p-1 dark:bg-surface-dark">
        <AbaBotao label="Meus treinos" ativa={aba === 'meus'} onPress={() => setAba('meus')} />
        <AbaBotao label="Treinos da IA" ativa={aba === 'ia'} onPress={() => setAba('ia')} />
      </View>

      {treinos.isLoading ? (
        <Loading />
      ) : treinos.isError ? (
        <ErrorState message={toApiError(treinos.error).message} onRetry={() => treinos.refetch()} />
      ) : (
        <FlatList
          data={treinos.data}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 24, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={treinos.isRefetching} onRefresh={() => { void treinos.refetch() }} tintColor={colors.primary} />}
          ListHeaderComponent={
            aba === 'ia' && treinos.data?.length ? (
              <Button title="Criar novo plano com IA" icon={Sparkles} variant="outline" small onPress={() => navigation.navigate('IaQuestionario')} />
            ) : undefined
          }
          ListEmptyComponent={
            aba === 'meus' ? (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum treino ainda"
                message="Monte seu primeiro treino escolhendo exercícios do catálogo, ou copie um treino da IA."
                action={<Button title="Criar treino" icon={Plus} onPress={() => navigation.navigate('TreinoForm', {})} />}
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                title="A IA monta seus treinos"
                message="Responda algumas perguntas e a IA cria um plano sob medida para seu objetivo, rotina e equipamentos."
                action={<Button title="Criar treino com IA" icon={Sparkles} onPress={() => navigation.navigate('IaQuestionario')} />}
              />
            )
          }
          renderItem={({ item }) => (
            <TreinoCard
              treino={item}
              destaque={item.dias_semana.includes(hoje) ? 'Hoje' : undefined}
              onPress={() => navigation.navigate('TreinoDetalhe', { id: item.id })}
            />
          )}
        />
      )}
    </Screen>
  )
}

function AbaBotao({ label, ativa, onPress }: { label: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`h-11 flex-1 items-center justify-center rounded-full ${ativa ? 'bg-primary' : ''}`}>
      <Text className={`font-bold text-base ${ativa ? 'text-white' : 'text-muted dark:text-muted-dark'}`}>{label}</Text>
    </Pressable>
  )
}

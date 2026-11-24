import { useNavigation, type NavigationProp } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dumbbell, Pencil, Plus, Power, Search, SearchX, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { definirExercicioAtivo, excluirExercicio, getExercicio, listarExercicios, listarExerciciosAdmin, listarGruposMusculares } from '../../api/catalogo'
import { ExercicioMidia, midiaExercicio, videoExterno } from '../../components/ExercicioMidia'
import { ConfirmSheet } from '../../components/treinos'
import { AppHeader, Button, Chip, EmptyState, ErrorState, Loading, Screen, TextField } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useDebounce } from '../../hooks/useDebounce'
import { toApiError } from '../../lib/api'
import { MODALIDADE_LABEL } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import { EQUIPAMENTO_LABEL, type Equipamento, type Exercicio } from '../../types/domain'

const EQUIPAMENTOS = Object.keys(EQUIPAMENTO_LABEL) as Equipamento[]

/** Catálogo: leitura para todos; o ADMIN vê também os desativados e ganha cadastrar/editar/desativar (regra 13). */
export function CatalogoScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParams>>()
  const { isAdmin } = useAuth()
  const { palette } = useTheme()
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState<number | undefined>()
  const [equipamento, setEquipamento] = useState<Equipamento | undefined>()
  const [inativos, setInativos] = useState(false)
  const q = useDebounce(busca)
  const modoAdmin = isAdmin && inativos

  const grupos = useQuery({ queryKey: ['grupos-musculares'], queryFn: listarGruposMusculares, staleTime: Infinity })
  const exercicios = useQuery({
    queryKey: ['exercicios', q, grupo, equipamento, modoAdmin],
    queryFn: () =>
      modoAdmin
        ? listarExerciciosAdmin({ q, grupo_muscular_id: grupo, equipamento, incluir_inativos: true })
        : listarExercicios({ q, grupo_muscular_id: grupo, equipamento }),
    placeholderData: (anterior) => anterior,
  })

  return (
    <Screen>
      <AppHeader
        title="Exercícios"
        right={
          isAdmin ? (
            <Pressable onPress={() => navigation.navigate('ExercicioForm', {})} accessibilityLabel="Novo exercício" className="h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Plus size={22} color="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      <View className="gap-3 px-6 pt-3">
        <TextField icon={Search} placeholder="Buscar exercício" value={busca} onChangeText={setBusca} autoCapitalize="none" returnKeyType="search" />
        {isAdmin && (
          <View className="flex-row items-center justify-between rounded-2xl bg-warning/15 px-4 py-2">
            <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Modo admin · mostrar desativados</Text>
            <Switch value={inativos} onValueChange={setInativos} trackColor={{ true: colors.primary, false: palette.elevated }} thumbColor="#fff" />
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24, paddingVertical: 12 }} className="max-h-16 grow-0">
        <Chip label="Todos" active={grupo === undefined} onPress={() => setGrupo(undefined)} />
        {grupos.data?.map((g) => (
          <Chip key={g.id} label={g.nome} active={grupo === g.id} onPress={() => setGrupo(grupo === g.id ? undefined : g.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24, paddingBottom: 12 }} className="max-h-14 grow-0">
        {EQUIPAMENTOS.map((e) => (
          <Chip key={e} label={EQUIPAMENTO_LABEL[e]} active={equipamento === e} onPress={() => setEquipamento(equipamento === e ? undefined : e)} />
        ))}
      </ScrollView>

      {exercicios.isLoading ? (
        <Loading />
      ) : exercicios.isError ? (
        <ErrorState message={toApiError(exercicios.error).message} onRetry={() => exercicios.refetch()} />
      ) : (
        <FlatList
          data={exercicios.data}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}
          ListEmptyComponent={<EmptyState icon={SearchX} title="Nada encontrado" message="Tente outro nome ou remova os filtros." />}
          renderItem={({ item }) => <ExercicioCard exercicio={item} onPress={() => navigation.navigate('ExercicioDetalhe', { id: item.id, nome: item.nome })} />}
        />
      )}
    </Screen>
  )
}

function ExercicioCard({ exercicio, onPress }: { exercicio: Exercicio; onPress: () => void }) {
  const midia = midiaExercicio(exercicio)
  return (
    <Pressable onPress={onPress} className={`flex-row items-center gap-4 overflow-hidden rounded-3xl bg-surface active:opacity-80 dark:bg-surface-dark ${exercicio.ativo === false ? 'opacity-60' : ''}`}>
      <ExercicioMidia uri={midia} tamanho={104} raio={0} iconeSize={30} />
      <View className="flex-1 gap-1 py-3 pr-4">
        <Text className="font-bold text-lg text-ink dark:text-ink-dark" numberOfLines={2}>
          {exercicio.nome}
        </Text>
        <Text className="font-medium text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
          {exercicio.grupos_musculares.map((g) => g.nome).join(' · ') || MODALIDADE_LABEL[exercicio.modalidades[0]] || ''}
        </Text>
        {exercicio.ativo === false && <Text className="font-bold text-xs text-warning">Desativado</Text>}
      </View>
    </Pressable>
  )
}

export function ExercicioDetalheScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'ExercicioDetalhe'>) {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [confirmar, setConfirmar] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const exercicio = useQuery({ queryKey: ['exercicio', route.params.id], queryFn: () => getExercicio(route.params.id) })

  const atualizarCaches = async () => {
    await queryClient.invalidateQueries({ queryKey: ['exercicios'] })
    await queryClient.invalidateQueries({ queryKey: ['exercicio', route.params.id] })
  }
  const alternarAtivo = useMutation({
    mutationFn: () => definirExercicioAtivo(route.params.id, !exercicio.data!.ativo),
    onSuccess: async (e) => {
      await atualizarCaches()
      setAviso(e.ativo ? 'Exercício reativado.' : 'Exercício desativado: some da busca e da IA, mas continua nos treinos que já o usam.')
    },
    onError: (e) => setAviso(toApiError(e).message),
  })
  const excluir = useMutation({
    mutationFn: () => excluirExercicio(route.params.id),
    onSuccess: async (r) => {
      setConfirmar(false)
      await atualizarCaches()
      if (r.excluido) navigation.goBack()
      else setAviso(r.message)
    },
    onError: (e) => {
      setConfirmar(false)
      setAviso(toApiError(e).message)
    },
  })

  if (exercicio.isLoading) return <Loading />
  if (exercicio.isError || !exercicio.data) return <ErrorState message={toApiError(exercicio.error).message} onRetry={() => exercicio.refetch()} />

  const e = exercicio.data
  const midia = midiaExercicio(e)
  const video = videoExterno(e)
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {midia ? (
          <ExercicioMidia uri={midia} animar raio={0} />
        ) : (
          <View className="h-56 w-full items-center justify-center bg-primary/15">
            <Dumbbell size={72} color={colors.primary} />
          </View>
        )}
        <View className="gap-5 p-6">
          <Text className="font-bold text-3xl text-ink dark:text-ink-dark">{e.nome}</Text>
          {e.ativo === false && (
            <View className="rounded-2xl bg-warning/20 p-3">
              <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Exercício desativado do catálogo.</Text>
            </View>
          )}
          <View className="flex-row flex-wrap gap-2">
            {e.grupos_musculares.map((g) => (
              <Chip key={g.id} label={g.nome} />
            ))}
            {e.equipamentos.map((eq) => (
              <Chip key={eq} label={EQUIPAMENTO_LABEL[eq]} />
            ))}
          </View>
          {video && <Button title="Ver vídeo" variant="secondary" small onPress={() => Linking.openURL(video)} />}
          <View className="h-px bg-edge dark:bg-edge-dark" />
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">Como fazer</Text>
          <Text className="font-medium text-base leading-6 text-muted dark:text-muted-dark">{e.instrucoes || e.descricao || 'Sem instruções cadastradas ainda.'}</Text>
          {e.instrucoes && e.descricao && e.descricao !== e.instrucoes && (
            <Text className="font-medium text-sm leading-5 text-muted dark:text-muted-dark">{e.descricao}</Text>
          )}

          {isAdmin && (
            <View className="gap-3 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
              <Text className="font-bold text-base text-ink dark:text-ink-dark">Admin</Text>
              {aviso && <Text className="font-semibold text-sm text-primary">{aviso}</Text>}
              <Button title="Editar" icon={Pencil} variant="secondary" small onPress={() => navigation.navigate('ExercicioForm', { id: e.id })} />
              <Button title={e.ativo ? 'Desativar' : 'Reativar'} icon={Power} variant="outline" small loading={alternarAtivo.isPending} onPress={() => alternarAtivo.mutate()} />
              <Button title="Excluir" icon={Trash2} variant="danger" small onPress={() => setConfirmar(true)} />
            </View>
          )}
        </View>
      </ScrollView>
      <ConfirmSheet
        visible={confirmar}
        danger
        title="Excluir exercício"
        message="Se o exercício já estiver em treinos ou históricos, ele será só desativado."
        confirmLabel="Excluir"
        loading={excluir.isPending}
        onConfirm={() => excluir.mutate()}
        onClose={() => setConfirmar(false)}
      />
    </View>
  )
}

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Search, SearchX, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { listarExercicios, listarGruposMusculares } from '../../api/catalogo'
import { atualizarTreino, criarTreino, getTreino } from '../../api/treinos'
import { ExercicioMidia, miniaturaExercicio } from '../../components/ExercicioMidia'
import { Button, Chip, EmptyState, ErrorState, Loading, SectionHeader, TextField } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useDebounce } from '../../hooks/useDebounce'
import { toApiError } from '../../lib/api'
import { DIA_SEMANA_CURTO, DIAS_SEMANA, kg, parseNumero } from '../../lib/format'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'
import type { Exercicio } from '../../types/domain'
import type { Treino, TreinoRequest } from '../../types/treinos'

interface ItemForm {
  chave: string
  id?: string
  exercicio: Exercicio
  ativo: boolean
  series: string
  repeticoes: string
  carga: string
  descanso: string
}

let contador = 0
const novaChave = () => `novo-${++contador}`
const texto = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','))

function itensDoTreino(t: Treino): ItemForm[] {
  return t.itens.map((i) => ({
    chave: i.id,
    id: i.id,
    exercicio: i.exercicio,
    ativo: i.exercicio_ativo,
    series: texto(i.series_alvo),
    repeticoes: texto(i.repeticoes_alvo),
    carga: i.carga_alvo_kg != null ? kg(i.carga_alvo_kg) : '',
    descanso: texto(i.descanso_alvo_seg),
  }))
}

/** Criar/editar treino manual: nome, dias da semana, exercícios do catálogo (ordem = posição), alvos por item. */
export function TreinoFormScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'TreinoForm'>) {
  const id = route.params?.id
  const queryClient = useQueryClient()
  const existente = useQuery({ queryKey: ['treino', id], queryFn: () => getTreino(id!), enabled: !!id })

  const [carregado, setCarregado] = useState(!id)
  const [nome, setNome] = useState('')
  const [dias, setDias] = useState<number[]>([])
  const [itens, setItens] = useState<ItemForm[]>([])
  const [seletor, setSeletor] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Editar treino' : 'Novo treino' })
  }, [id, navigation])

  useEffect(() => {
    if (existente.data && !carregado) {
      setNome(existente.data.nome)
      setDias(existente.data.dias_semana)
      setItens(itensDoTreino(existente.data))
      setCarregado(true)
    }
  }, [existente.data, carregado])

  const salvar = useMutation({
    mutationFn: (body: TreinoRequest) => (id ? atualizarTreino(id, body) : criarTreino(body)),
    onSuccess: async (treino) => {
      queryClient.setQueryData(['treino', treino.id], treino)
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['treinos'] }), queryClient.invalidateQueries({ queryKey: ['hoje'] })])
      if (id) navigation.goBack()
      else navigation.replace('TreinoDetalhe', { id: treino.id })
    },
    onError: (e) => setErro(toApiError(e).message),
  })

  if (id && existente.isLoading) return <Loading />
  if (id && existente.isError) return <ErrorState message={toApiError(existente.error).message} onRetry={() => existente.refetch()} />

  const alterar = (chave: string, campo: keyof ItemForm, valor: string) =>
    setItens((lista) => lista.map((i) => (i.chave === chave ? { ...i, [campo]: valor } : i)))

  const mover = (indice: number, delta: number) =>
    setItens((lista) => {
      const destino = indice + delta
      if (destino < 0 || destino >= lista.length) return lista
      const copia = [...lista]
      ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
      return copia
    })

  const adicionar = (exercicios: Exercicio[]) => {
    setItens((lista) => [
      ...lista,
      ...exercicios.map((e) => ({ chave: novaChave(), exercicio: e, ativo: true, series: '3', repeticoes: '12', carga: '', descanso: '60' })),
    ])
    setSeletor(false)
  }

  const enviar = () => {
    setErro(null)
    if (!nome.trim()) return setErro('Informe o nome do treino.')
    const corpo: TreinoRequest = {
      nome: nome.trim(),
      dias_semana: [...dias].sort((a, b) => a - b),
      itens: itens.map((i) => {
        const pesoReps = i.exercicio.metrica === 'peso_reps'
        return {
          id: i.id,
          exercicio_id: i.exercicio.id,
          series_alvo: parseNumero(i.series),
          repeticoes_alvo: pesoReps ? parseNumero(i.repeticoes) : null,
          carga_alvo_kg: pesoReps ? parseNumero(i.carga) : null,
          descanso_alvo_seg: parseNumero(i.descanso),
        }
      }),
    }
    salvar.mutate(corpo)
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 120 }}>
        <TextField placeholder="Nome do treino (ex.: Treino A - Peito)" value={nome} onChangeText={setNome} maxLength={120} />

        <View className="gap-3">
          <SectionHeader title="Dias da semana" />
          <View className="flex-row flex-wrap gap-2">
            {DIAS_SEMANA.map((d) => (
              <Chip key={d} label={DIA_SEMANA_CURTO[d]} active={dias.includes(d)} onPress={() => setDias((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]))} />
            ))}
          </View>
          <Text className="font-medium text-sm text-muted dark:text-muted-dark">O treino aparece na tela Hoje nos dias marcados.</Text>
        </View>

        <View className="gap-3">
          <SectionHeader title={`Exercícios (${itens.length})`} action="Adicionar" onAction={() => setSeletor(true)} />
          {itens.map((item, i) => (
            <ItemEditavel
              key={item.chave}
              item={item}
              posicao={i + 1}
              primeiro={i === 0}
              ultimo={i === itens.length - 1}
              onAlterar={(campo, valor) => alterar(item.chave, campo, valor)}
              onSubir={() => mover(i, -1)}
              onDescer={() => mover(i, 1)}
              onRemover={() => setItens((lista) => lista.filter((x) => x.chave !== item.chave))}
            />
          ))}
          <Button title="Adicionar exercício" icon={Plus} variant="outline" onPress={() => setSeletor(true)} />
        </View>

        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
      </KeyboardAwareScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-edge bg-background px-6 pb-8 pt-4 dark:border-edge-dark dark:bg-background-dark">
        <Button title={id ? 'Salvar alterações' : 'Criar treino'} onPress={enviar} loading={salvar.isPending} />
      </View>

      <SeletorExercicios visible={seletor} jaAdicionados={itens.map((i) => i.exercicio.id)} onClose={() => setSeletor(false)} onConfirm={adicionar} />
    </View>
  )
}

function ItemEditavel({
  item,
  posicao,
  primeiro,
  ultimo,
  onAlterar,
  onSubir,
  onDescer,
  onRemover,
}: {
  item: ItemForm
  posicao: number
  primeiro: boolean
  ultimo: boolean
  onAlterar: (campo: keyof ItemForm, valor: string) => void
  onSubir: () => void
  onDescer: () => void
  onRemover: () => void
}) {
  const { palette } = useTheme()
  const pesoReps = item.exercicio.metrica === 'peso_reps'
  return (
    <View className="gap-3 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 font-bold text-base text-ink dark:text-ink-dark" numberOfLines={2}>
          {posicao}. {item.exercicio.nome}
        </Text>
        <Pressable onPress={onSubir} disabled={primeiro} hitSlop={6} accessibilityLabel="Mover para cima" className="p-1">
          <ArrowUp size={20} color={primeiro ? palette.elevated : palette.ink} />
        </Pressable>
        <Pressable onPress={onDescer} disabled={ultimo} hitSlop={6} accessibilityLabel="Mover para baixo" className="p-1">
          <ArrowDown size={20} color={ultimo ? palette.elevated : palette.ink} />
        </Pressable>
        <Pressable onPress={onRemover} hitSlop={6} accessibilityLabel="Remover" className="p-1">
          <X size={20} color={colors.danger} />
        </Pressable>
      </View>
      {!item.ativo && <Text className="font-semibold text-xs text-warning">Exercício desativado do catálogo</Text>}
      <View className="flex-row gap-2">
        <CampoNumero label="Séries" value={item.series} onChange={(v) => onAlterar('series', v)} />
        {pesoReps && <CampoNumero label="Reps" value={item.repeticoes} onChange={(v) => onAlterar('repeticoes', v)} />}
        {pesoReps && <CampoNumero label="Carga kg" value={item.carga} onChange={(v) => onAlterar('carga', v)} decimal />}
        <CampoNumero label="Descanso s" value={item.descanso} onChange={(v) => onAlterar('descanso', v)} />
      </View>
    </View>
  )
}

export function CampoNumero({ label, value, onChange, decimal }: { label: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  const { palette } = useTheme()
  return (
    <View className="flex-1 gap-1">
      <Text className="font-semibold text-xs text-muted dark:text-muted-dark">{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, ''))}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="–"
        placeholderTextColor={palette.muted}
        maxLength={6}
        className="h-11 rounded-xl bg-background px-3 text-center font-bold text-base text-ink dark:bg-elevated-dark dark:text-ink-dark"
      />
    </View>
  )
}

/** Busca no catálogo (só ativos) com multisseleção; abre como modal por cima do formulário. */
function SeletorExercicios({
  visible,
  jaAdicionados,
  onClose,
  onConfirm,
}: {
  visible: boolean
  jaAdicionados: string[]
  onClose: () => void
  onConfirm: (exercicios: Exercicio[]) => void
}) {
  const insets = useSafeAreaInsets()
  const { palette } = useTheme()
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState<number | undefined>()
  const [selecionados, setSelecionados] = useState<Exercicio[]>([])
  const q = useDebounce(busca)

  useEffect(() => {
    if (visible) setSelecionados([])
  }, [visible])

  const grupos = useQuery({ queryKey: ['grupos-musculares'], queryFn: listarGruposMusculares, staleTime: Infinity, enabled: visible })
  const exercicios = useQuery({
    queryKey: ['exercicios', q, grupo, undefined],
    queryFn: () => listarExercicios({ q, grupo_muscular_id: grupo }),
    placeholderData: (anterior) => anterior,
    enabled: visible,
  })

  const alternar = (e: Exercicio) =>
    setSelecionados((v) => (v.some((x) => x.id === e.id) ? v.filter((x) => x.id !== e.id) : [...v, e]))

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ paddingTop: insets.top }} className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Escolher exercícios</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar">
            <X size={26} color={palette.ink} />
          </Pressable>
        </View>
        <View className="px-6">
          <TextField icon={Search} placeholder="Buscar exercício" value={busca} onChangeText={setBusca} autoCapitalize="none" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24, paddingVertical: 12 }} className="max-h-16 grow-0">
          <Chip label="Todos" active={grupo === undefined} onPress={() => setGrupo(undefined)} />
          {grupos.data?.map((g) => (
            <Chip key={g.id} label={g.nome} active={grupo === g.id} onPress={() => setGrupo(grupo === g.id ? undefined : g.id)} />
          ))}
        </ScrollView>
        {exercicios.isLoading ? (
          <Loading />
        ) : (
          <FlatList
            data={exercicios.data}
            keyExtractor={(e) => e.id}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 10 }}
            ListEmptyComponent={<EmptyState icon={SearchX} title="Nada encontrado" message="Tente outro nome ou remova o filtro." />}
            renderItem={({ item }) => {
              const marcado = selecionados.some((x) => x.id === item.id)
              const jaNoTreino = jaAdicionados.includes(item.id)
              const thumb = miniaturaExercicio(item)
              return (
                <Pressable
                  onPress={() => alternar(item)}
                  className={`flex-row items-center gap-3 rounded-2xl border-2 bg-surface p-2 dark:bg-surface-dark ${marcado ? 'border-primary' : 'border-transparent'}`}
                >
                  <ExercicioMidia uri={thumb} tamanho={56} raio={12} iconeSize={22} />
                  <View className="flex-1">
                    <Text className="font-bold text-base text-ink dark:text-ink-dark" numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text className="font-medium text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                      {jaNoTreino ? 'Já está no treino · ' : ''}
                      {item.grupos_musculares.map((g) => g.nome).join(' · ')}
                    </Text>
                  </View>
                  <View className={`h-6 w-6 items-center justify-center rounded-md border-2 border-primary ${marcado ? 'bg-primary' : ''}`}>
                    {marcado && <Text className="font-bold text-xs text-white">{selecionados.findIndex((x) => x.id === item.id) + 1}</Text>}
                  </View>
                </Pressable>
              )
            }}
          />
        )}
        <View style={{ paddingBottom: insets.bottom + 16 }} className="absolute bottom-0 left-0 right-0 border-t border-edge bg-background px-6 pt-4 dark:border-edge-dark dark:bg-background-dark">
          <Button
            title={selecionados.length ? `Adicionar ${selecionados.length} exercício${selecionados.length > 1 ? 's' : ''}` : 'Selecione exercícios'}
            disabled={!selecionados.length}
            onPress={() => onConfirm(selecionados)}
          />
        </View>
      </View>
    </Modal>
  )
}

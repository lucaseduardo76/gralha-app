import AsyncStorage from '@react-native-async-storage/async-storage'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Dumbbell, Flag, Plus, Timer, Trash2, X } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { ExercicioMidia, gifDaMiniatura } from '../../components/ExercicioMidia'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { descartarSessao, finalizarSessao, getSessao, getSessaoEmAndamento, iniciarSessao, salvarSeries } from '../../api/sessoes'
import { ConfirmSheet } from '../../components/treinos'
import { Button, EmptyState, ErrorState, Loading } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { toApiError } from '../../lib/api'
import { kg, parseNumero, resumoAlvos } from '../../lib/format'
import { colors } from '../../lib/theme'
import { uuid } from '../../lib/uuid'
import type { AppStackParams } from '../../navigation/types'
import type { ItemSnapshot, Serie, SerieRequest, Sessao, UltimoResultado } from '../../types/sessoes'

interface Linha {
  a: string // carga (peso_reps) | distância km (distancia_tempo) | duração s (sustentacao)
  b: string // reps (peso_reps) | duração s (distancia_tempo) | reps de mobilização (sustentacao)
  concluida: boolean
}
type Linhas = Record<string, Linha[]> // por exercicio_id, índice = numero_serie - 1

const RASCUNHO = (id: string) => `sessao-rascunho:${id}`
const AUTOSAVE_MS = 1200

const CAMPOS = {
  peso_reps: { a: 'kg', b: 'reps' },
  distancia_tempo: { a: 'km', b: 'seg' },
  sustentacao: { a: 'seg', b: 'reps' },
} as const

function linhasIniciais(sessao: Sessao): Linhas {
  const linhas: Linhas = {}
  for (const item of sessao.itens) {
    const feitas = sessao.series.filter((s) => s.exercicio_id === item.exercicio_id)
    const total = Math.max(item.series_alvo ?? 3, ...feitas.map((s) => s.numero_serie), 1)
    linhas[item.exercicio_id] = Array.from({ length: total }, (_, i) => {
      const s = feitas.find((x) => x.numero_serie === i + 1)
      return s ? doServidor(s, item) : { a: '', b: '', concluida: false }
    })
  }
  return linhas
}

function doServidor(s: Serie, item: ItemSnapshot): Linha {
  const t = (n: number | null) => (n == null ? '' : String(n).replace('.', ','))
  if (item.metrica === 'distancia_tempo') return { a: t(s.distancia_km), b: t(s.duracao_seg), concluida: s.concluida }
  if (item.metrica === 'sustentacao') return { a: t(s.duracao_seg), b: t(s.repeticoes), concluida: s.concluida }
  return { a: t(s.carga_kg), b: t(s.repeticoes), concluida: s.concluida }
}

function paraServidor(linhas: Linhas, itens: ItemSnapshot[]): SerieRequest[] {
  const series: SerieRequest[] = []
  for (const item of itens) {
    ;(linhas[item.exercicio_id] ?? []).forEach((l, i) => {
      const a = parseNumero(l.a)
      const b = parseNumero(l.b)
      if (a == null && b == null && !l.concluida) return
      const base = { exercicio_id: item.exercicio_id, prescricao_id: item.prescricao_id, numero_serie: i + 1, concluida: l.concluida }
      if (item.metrica === 'distancia_tempo') series.push({ ...base, carga_kg: null, repeticoes: null, distancia_km: a, duracao_seg: b })
      else if (item.metrica === 'sustentacao') series.push({ ...base, carga_kg: null, repeticoes: b, distancia_km: null, duracao_seg: a })
      else series.push({ ...base, carga_kg: a, repeticoes: b, distancia_km: null, duracao_seg: null })
    })
  }
  return series
}

/** Valores sugeridos (placeholder) de uma série: o planejado, senão o que foi feito da última vez. */
function sugestao(item: ItemSnapshot, ultimo: UltimoResultado | undefined, indice: number): { a: string; b: string } {
  const anterior = ultimo?.series[Math.min(indice, (ultimo?.series.length ?? 1) - 1)]
  if (item.metrica === 'peso_reps')
    return {
      a: item.carga_alvo_kg != null ? kg(item.carga_alvo_kg) : anterior?.carga_kg != null ? kg(anterior.carga_kg) : '',
      b: item.repeticoes_alvo != null ? String(item.repeticoes_alvo) : anterior?.repeticoes != null ? String(anterior.repeticoes) : '',
    }
  if (item.metrica === 'sustentacao') return { a: item.duracao_alvo_seg != null ? String(item.duracao_alvo_seg) : '', b: '' }
  return { a: item.distancia_alvo_km != null ? String(item.distancia_alvo_km) : '', b: item.duracao_alvo_seg != null ? String(item.duracao_alvo_seg) : '' }
}

function textoUltimo(item: ItemSnapshot, ultimo: UltimoResultado | undefined): string | null {
  if (!ultimo?.series.length) return null
  if (item.metrica !== 'peso_reps') return `Última vez: ${ultimo.series.length} séries`
  const max = Math.max(...ultimo.series.map((s) => s.carga_kg ?? 0))
  const reps = ultimo.series.map((s) => s.repeticoes ?? 0)
  return `Última vez: ${ultimo.series.length} × ${Math.max(...reps)}${max ? ` @ ${kg(max)} kg` : ''}`
}

function useCronometro(inicio: string | undefined) {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!inicio) return '00:00'
  const seg = Math.max(0, Math.floor((agora - new Date(inicio).getTime()) / 1000))
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Treino em andamento (telas "Workout" 35–42 do kit). A sessão existe no servidor desde o início; cada alteração vai
 * para o rascunho local na hora e para o servidor com debounce. Só ao finalizar vira resultado.
 */
export function SessaoScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'Sessao'>) {
  const queryClient = useQueryClient()
  const treinoId = route.params?.treinoId
  const idNovo = useRef(uuid()).current
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [linhas, setLinhas] = useState<Linhas>({})
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<'ok' | 'pendente' | 'erro'>('ok')
  const [sheet, setSheet] = useState<'finalizar' | 'descartar' | null>(null)
  const [descanso, setDescanso] = useState<{ fim: number; total: number } | null>(null)
  const sujo = useRef(false)
  const fecharDescanso = useCallback(() => setDescanso(null), [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      let s: Sessao | null
      if (treinoId) {
        try {
          s = await iniciarSessao(idNovo, treinoId)
        } catch (e) {
          const err = toApiError(e)
          const outra = err.status === 409 ? (err.data?.sessao_id as string | undefined) : undefined
          if (!outra) throw e
          s = await getSessao(outra)
          if (s.treino_id !== treinoId) setAviso(`Você já tinha um treino em andamento (${s.nome_treino}). Continue ou descarte para começar outro.`)
        }
      } else {
        s = await getSessaoEmAndamento()
      }
      if (s) {
        const rascunho = await AsyncStorage.getItem(RASCUNHO(s.id))
        setLinhas(rascunho ? { ...linhasIniciais(s), ...(JSON.parse(rascunho) as Linhas) } : linhasIniciais(s))
        sujo.current = !!rascunho
      }
      setSessao(s)
      queryClient.invalidateQueries({ queryKey: ['hoje'] })
    } catch (e) {
      setErro(toApiError(e).message)
    } finally {
      setCarregando(false)
    }
  }, [treinoId, idNovo, queryClient])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Autosave: rascunho local imediato + servidor com debounce.
  useEffect(() => {
    if (!sessao || sessao.status !== 'EM_ANDAMENTO' || !sujo.current) return
    AsyncStorage.setItem(RASCUNHO(sessao.id), JSON.stringify(linhas)).catch(() => {})
    setSalvando('pendente')
    const t = setTimeout(async () => {
      try {
        await salvarSeries(sessao.id, paraServidor(linhas, sessao.itens))
        setSalvando('ok')
      } catch {
        setSalvando('erro')
      }
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [linhas, sessao])

  const alterar = (exercicioId: string, indice: number, mudanca: Partial<Linha>) => {
    sujo.current = true
    setLinhas((atual) => ({ ...atual, [exercicioId]: atual[exercicioId].map((l, i) => (i === indice ? { ...l, ...mudanca } : l)) }))
  }

  const alternarConcluida = (item: ItemSnapshot, indice: number) => {
    const linha = linhas[item.exercicio_id][indice]
    const vaiConcluir = !linha.concluida
    const sug = sugestao(item, sessao?.ultimo_resultado[item.exercicio_id], indice)
    alterar(item.exercicio_id, indice, {
      concluida: vaiConcluir,
      ...(vaiConcluir ? { a: linha.a || sug.a, b: linha.b || sug.b } : {}),
    })
    if (vaiConcluir && item.descanso_alvo_seg) setDescanso({ fim: Date.now() + item.descanso_alvo_seg * 1000, total: item.descanso_alvo_seg })
  }

  const adicionarSerie = (exercicioId: string) => {
    sujo.current = true
    setLinhas((atual) => ({ ...atual, [exercicioId]: [...atual[exercicioId], { a: '', b: '', concluida: false }] }))
  }

  const removerUltima = (exercicioId: string) => {
    sujo.current = true
    setLinhas((atual) => ({ ...atual, [exercicioId]: atual[exercicioId].length > 1 ? atual[exercicioId].slice(0, -1) : atual[exercicioId] }))
  }

  const limparRascunho = (id: string) => AsyncStorage.removeItem(RASCUNHO(id)).catch(() => {})

  const finalizar = useMutation({
    mutationFn: async () => {
      await salvarSeries(sessao!.id, paraServidor(linhas, sessao!.itens))
      return finalizarSessao(sessao!.id)
    },
    onSuccess: async (resumo) => {
      await limparRascunho(resumo.sessao.id)
      queryClient.setQueryData(['resumo-sessao', resumo.sessao.id], resumo)
      queryClient.invalidateQueries({ queryKey: ['hoje'] })
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      queryClient.invalidateQueries({ queryKey: ['perfil-resumo'] })
      setSheet(null)
      navigation.replace('ResumoSessao', { sessaoId: resumo.sessao.id })
    },
    onError: (e) => {
      setSheet(null)
      setErro(toApiError(e).message)
    },
  })

  const descartar = useMutation({
    mutationFn: () => descartarSessao(sessao!.id),
    onSuccess: async () => {
      await limparRascunho(sessao!.id)
      queryClient.invalidateQueries({ queryKey: ['hoje'] })
      setSheet(null)
      navigation.goBack()
    },
    onError: (e) => {
      setSheet(null)
      setErro(toApiError(e).message)
    },
  })

  const cronometro = useCronometro(sessao?.iniciada_em)
  const concluidas = useMemo(() => Object.values(linhas).flat().filter((l) => l.concluida).length, [linhas])
  const total = useMemo(() => Object.values(linhas).flat().length, [linhas])

  useEffect(() => {
    navigation.setOptions({ title: sessao?.nome_treino ?? 'Treino' })
  }, [navigation, sessao?.nome_treino])

  if (carregando) return <Loading />
  if (erro && !sessao) return <ErrorState message={erro} onRetry={carregar} />
  if (!sessao)
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <EmptyState icon={Dumbbell} title="Nenhum treino em andamento" message="Escolha um treino e toque em Iniciar." action={<Button title="Voltar" onPress={() => navigation.goBack()} />} />
      </View>
    )

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 pb-3">
        <View className="flex-row items-center gap-2">
          <Timer size={20} color={colors.primary} />
          <Text className="font-bold text-2xl text-ink dark:text-ink-dark">{cronometro}</Text>
        </View>
        <Text className="font-semibold text-sm text-muted dark:text-muted-dark">
          {concluidas}/{total} séries · {salvando === 'pendente' ? 'salvando…' : salvando === 'erro' ? 'sem conexão — rascunho salvo no aparelho' : 'salvo'}
        </Text>
      </View>
      <View className="mx-6 h-2 overflow-hidden rounded-full bg-surface dark:bg-surface-dark">
        <View className="h-2 rounded-full bg-primary" style={{ width: `${total ? (concluidas / total) * 100 : 0}%` }} />
      </View>

      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 200 }}>
        {aviso && (
          <View className="rounded-2xl bg-warning/20 p-4">
            <Text className="font-semibold text-sm text-ink dark:text-ink-dark">{aviso}</Text>
          </View>
        )}
        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
        {sessao.itens.map((item, pos) => (
          <CartaoExercicio
            key={`${item.exercicio_id}-${pos}`}
            item={item}
            posicao={pos + 1}
            linhas={linhas[item.exercicio_id] ?? []}
            ultimo={sessao.ultimo_resultado[item.exercicio_id]}
            onAlterar={(i, m) => alterar(item.exercicio_id, i, m)}
            onConcluir={(i) => alternarConcluida(item, i)}
            onAdicionar={() => adicionarSerie(item.exercicio_id)}
            onRemover={() => removerUltima(item.exercicio_id)}
          />
        ))}
        <Button title="Descartar treino" icon={Trash2} variant="outline" small onPress={() => setSheet('descartar')} />
      </KeyboardAwareScrollView>

      <View className="absolute bottom-0 left-0 right-0 gap-3 border-t border-edge bg-background px-6 pb-8 pt-3 dark:border-edge-dark dark:bg-background-dark">
        {descanso && <Descanso descanso={descanso} onFim={fecharDescanso} onMais={() => setDescanso((d) => (d ? { fim: d.fim + 15_000, total: d.total + 15 } : d))} />}
        <Button title="Finalizar treino" icon={Flag} onPress={() => setSheet('finalizar')} disabled={!concluidas} />
      </View>

      <ConfirmSheet
        visible={sheet === 'finalizar'}
        title="Finalizar treino"
        message={`${concluidas} de ${total} séries concluídas. Depois de finalizar, o treino entra nos seus resultados.`}
        confirmLabel="Finalizar"
        loading={finalizar.isPending}
        onConfirm={() => finalizar.mutate()}
        onClose={() => setSheet(null)}
      />
      <ConfirmSheet
        visible={sheet === 'descartar'}
        danger
        title="Descartar treino"
        message="As séries desta sessão serão apagadas e não contam nos resultados."
        confirmLabel="Descartar"
        loading={descartar.isPending}
        onConfirm={() => descartar.mutate()}
        onClose={() => setSheet(null)}
      />
    </View>
  )
}

function CartaoExercicio({
  item,
  posicao,
  linhas,
  ultimo,
  onAlterar,
  onConcluir,
  onAdicionar,
  onRemover,
}: {
  item: ItemSnapshot
  posicao: number
  linhas: Linha[]
  ultimo: UltimoResultado | undefined
  onAlterar: (indice: number, mudanca: Partial<Linha>) => void
  onConcluir: (indice: number) => void
  onAdicionar: () => void
  onRemover: () => void
}) {
  const { palette } = useTheme()
  const campos = CAMPOS[item.metrica]
  const ref = textoUltimo(item, ultimo)
  const feitas = linhas.filter((l) => l.concluida).length
  return (
    <View className="gap-3 rounded-3xl bg-surface p-4 dark:bg-surface-dark">
      <View className="flex-row items-center gap-3">
        <ExercicioMidia uri={gifDaMiniatura(item.thumbnail_url)} animar tamanho={72} raio={16} iconeSize={24} />
        <View className="flex-1">
          <Text className="font-bold text-base text-ink dark:text-ink-dark" numberOfLines={2}>
            {posicao}. {item.nome}
          </Text>
          <Text className="font-medium text-xs text-muted dark:text-muted-dark">Meta: {resumoAlvos(item)}</Text>
          {ref && <Text className="font-semibold text-xs text-primary">{ref}</Text>}
        </View>
        {feitas === linhas.length && linhas.length > 0 && (
          <View className="h-7 w-7 items-center justify-center rounded-full bg-success">
            <Check size={16} color="#fff" strokeWidth={3} />
          </View>
        )}
      </View>

      <View className="flex-row px-1">
        <Text className="w-10 font-semibold text-xs text-muted dark:text-muted-dark">Série</Text>
        <Text className="flex-1 text-center font-semibold text-xs text-muted dark:text-muted-dark">{campos.a}</Text>
        <Text className="flex-1 text-center font-semibold text-xs text-muted dark:text-muted-dark">{campos.b}</Text>
        <View className="w-12" />
      </View>
      {linhas.map((l, i) => {
        const sug = sugestao(item, ultimo, i)
        return (
          <View key={i} className={`flex-row items-center gap-2 rounded-2xl px-1 py-1 ${l.concluida ? 'bg-success/10' : ''}`}>
            <Text className="w-8 text-center font-bold text-base text-ink dark:text-ink-dark">{i + 1}</Text>
            <Entrada value={l.a} placeholder={sug.a} onChange={(v) => onAlterar(i, { a: v })} decimal palette={palette} />
            <Entrada value={l.b} placeholder={sug.b} onChange={(v) => onAlterar(i, { b: v })} palette={palette} />
            <Pressable
              onPress={() => onConcluir(i)}
              accessibilityLabel={l.concluida ? `Desmarcar série ${i + 1}` : `Concluir série ${i + 1}`}
              className={`h-11 w-11 items-center justify-center rounded-xl border-2 ${l.concluida ? 'border-success bg-success' : 'border-primary'}`}
            >
              <Check size={20} color={l.concluida ? '#fff' : colors.primary} strokeWidth={3} />
            </Pressable>
          </View>
        )
      })}
      <View className="flex-row justify-between">
        <Pressable onPress={onAdicionar} hitSlop={8} className="flex-row items-center gap-1">
          <Plus size={16} color={colors.primary} />
          <Text className="font-bold text-sm text-primary">Série</Text>
        </Pressable>
        {linhas.length > 1 && (
          <Pressable onPress={onRemover} hitSlop={8} className="flex-row items-center gap-1">
            <X size={16} color={palette.muted} />
            <Text className="font-bold text-sm text-muted dark:text-muted-dark">Remover última</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

function Entrada({
  value,
  placeholder,
  onChange,
  decimal,
  palette,
}: {
  value: string
  placeholder: string
  onChange: (v: string) => void
  decimal?: boolean
  palette: { muted: string }
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(v) => onChange(v.replace(decimal ? /[^0-9.,]/g : /[^0-9]/g, ''))}
      placeholder={placeholder || '–'}
      placeholderTextColor={palette.muted}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      maxLength={6}
      className="h-11 flex-1 rounded-xl bg-background text-center font-bold text-base text-ink dark:bg-elevated-dark dark:text-ink-dark"
    />
  )
}

/** Contagem regressiva do descanso (tela "Take a Rest" do kit), compacta no rodapé. */
function Descanso({ descanso, onFim, onMais }: { descanso: { fim: number; total: number }; onFim: () => void; onMais: () => void }) {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  const restante = Math.max(0, Math.ceil((descanso.fim - agora) / 1000))
  useEffect(() => {
    if (restante === 0) {
      const t = setTimeout(onFim, 1500)
      return () => clearTimeout(t)
    }
  }, [restante, onFim])
  const pct = Math.min(100, (1 - restante / descanso.total) * 100)
  return (
    <View className="gap-2 rounded-2xl bg-primary/15 p-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-base text-ink dark:text-ink-dark">{restante ? `Descanso: ${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : 'Bora pra próxima série! 💪'}</Text>
        <View className="flex-row gap-4">
          <Pressable onPress={onMais} hitSlop={8}>
            <Text className="font-bold text-sm text-primary">+15 s</Text>
          </Pressable>
          <Pressable onPress={onFim} hitSlop={8}>
            <Text className="font-bold text-sm text-primary">Pular</Text>
          </Pressable>
        </View>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-background dark:bg-background-dark">
        <View className="h-1.5 bg-primary" style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}

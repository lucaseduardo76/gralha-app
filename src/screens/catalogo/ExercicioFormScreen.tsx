import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { atualizarExercicio, criarExercicio, getExercicio, listarGruposMusculares } from '../../api/catalogo'
import { Button, Chip, ErrorState, Loading, SectionHeader, TextField } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { toApiError } from '../../lib/api'
import { MODALIDADE_LABEL } from '../../lib/format'
import type { AppStackParams } from '../../navigation/types'
import {
  EQUIPAMENTO_LABEL,
  METRICA_LABEL,
  REGIAO_LABEL,
  type Equipamento,
  type ExercicioAdminRequest,
  type Metrica,
  type Modalidade,
  type RegiaoCorpo,
} from '../../types/domain'

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

/** Cadastro/edição de exercício pelo admin. Mídia por URL (upload fica para depois). */
export function ExercicioFormScreen({ route, navigation }: NativeStackScreenProps<AppStackParams, 'ExercicioForm'>) {
  const id = route.params?.id
  const queryClient = useQueryClient()
  const { palette } = useTheme()
  const grupos = useQuery({ queryKey: ['grupos-musculares'], queryFn: listarGruposMusculares, staleTime: Infinity })
  const existente = useQuery({ queryKey: ['exercicio', id], queryFn: () => getExercicio(id!), enabled: !!id })
  const [carregado, setCarregado] = useState(!id)
  const [form, setForm] = useState<ExercicioAdminRequest>({
    nome: '',
    descricao: null,
    instrucoes: null,
    metrica: 'peso_reps',
    grupos_musculares_ids: [],
    modalidades: ['musculacao'],
    equipamentos: [],
    conflitos_lesao: [],
    video_url_male: null,
    video_url_female: null,
    thumbnail_url_male: null,
    thumbnail_url_female: null,
  })
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => navigation.setOptions({ title: id ? 'Editar exercício' : 'Novo exercício' }), [id, navigation])
  useEffect(() => {
    const e = existente.data
    if (e && !carregado) {
      setForm({
        nome: e.nome,
        descricao: e.descricao,
        instrucoes: e.instrucoes,
        metrica: e.metrica,
        grupos_musculares_ids: e.grupos_musculares.map((g) => g.id),
        modalidades: e.modalidades,
        equipamentos: e.equipamentos,
        conflitos_lesao: e.conflitos_lesao,
        video_url_male: e.video_url_male,
        video_url_female: e.video_url_female,
        thumbnail_url_male: e.thumbnail_url_male,
        thumbnail_url_female: e.thumbnail_url_female,
      })
      setCarregado(true)
    }
  }, [existente.data, carregado])

  const salvar = useMutation({
    mutationFn: () => (id ? atualizarExercicio(id, form) : criarExercicio(form)),
    onSuccess: async (e) => {
      queryClient.setQueryData(['exercicio', e.id], e)
      await queryClient.invalidateQueries({ queryKey: ['exercicios'] })
      navigation.goBack()
    },
    onError: (e) => setErro(toApiError(e).message),
  })

  if ((id && existente.isLoading) || grupos.isLoading) return <Loading />
  if (id && existente.isError) return <ErrorState message={toApiError(existente.error).message} onRetry={() => existente.refetch()} />

  const set = <K extends keyof ExercicioAdminRequest>(k: K, v: ExercicioAdminRequest[K]) => setForm((f) => ({ ...f, [k]: v }))
  const texto = (v: string) => (v.trim() ? v : null)

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 120 }}>
        <TextField placeholder="Nome do exercício" value={form.nome} onChangeText={(v) => set('nome', v)} maxLength={120} />

        <Secao titulo="Métrica">
          {(Object.keys(METRICA_LABEL) as Metrica[]).map((m) => (
            <Chip key={m} label={METRICA_LABEL[m]} active={form.metrica === m} onPress={() => set('metrica', m)} />
          ))}
        </Secao>
        <Secao titulo="Grupos musculares">
          {grupos.data?.map((g) => (
            <Chip key={g.id} label={g.nome} active={form.grupos_musculares_ids.includes(g.id)} onPress={() => set('grupos_musculares_ids', alternar(form.grupos_musculares_ids, g.id))} />
          ))}
        </Secao>
        <Secao titulo="Modalidades">
          {(Object.keys(MODALIDADE_LABEL) as Modalidade[]).map((m) => (
            <Chip key={m} label={MODALIDADE_LABEL[m]} active={form.modalidades.includes(m)} onPress={() => set('modalidades', alternar(form.modalidades, m))} />
          ))}
        </Secao>
        <Secao titulo="Equipamentos">
          {(Object.keys(EQUIPAMENTO_LABEL) as Equipamento[]).map((e) => (
            <Chip key={e} label={EQUIPAMENTO_LABEL[e]} active={form.equipamentos.includes(e)} onPress={() => set('equipamentos', alternar(form.equipamentos, e))} />
          ))}
        </Secao>
        <Secao titulo="Evitar com lesão em">
          {(Object.keys(REGIAO_LABEL) as RegiaoCorpo[]).map((r) => (
            <Chip key={r} label={REGIAO_LABEL[r]} active={form.conflitos_lesao.includes(r)} onPress={() => set('conflitos_lesao', alternar(form.conflitos_lesao, r))} />
          ))}
        </Secao>

        <SectionHeader title="Instruções" />
        <TextInput
          value={form.instrucoes ?? ''}
          onChangeText={(v) => set('instrucoes', texto(v))}
          multiline
          maxLength={4000}
          placeholder="Passo a passo da execução"
          placeholderTextColor={palette.muted}
          textAlignVertical="top"
          className="min-h-32 rounded-2xl bg-surface p-4 font-semibold text-base text-ink dark:bg-surface-dark dark:text-ink-dark"
        />
        <TextField placeholder="Descrição curta (opcional)" value={form.descricao ?? ''} onChangeText={(v) => set('descricao', texto(v))} maxLength={1000} />

        <SectionHeader title="Mídia (URLs)" />
        <TextField placeholder="Miniatura (https://…)" value={form.thumbnail_url_female ?? ''} onChangeText={(v) => set('thumbnail_url_female', texto(v))} autoCapitalize="none" keyboardType="url" />
        <TextField placeholder="Vídeo (https://…)" value={form.video_url_female ?? ''} onChangeText={(v) => set('video_url_female', texto(v))} autoCapitalize="none" keyboardType="url" />

        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
      </KeyboardAwareScrollView>
      <View className="absolute bottom-0 left-0 right-0 border-t border-edge bg-background px-6 pb-8 pt-4 dark:border-edge-dark dark:bg-background-dark">
        <Button
          title={id ? 'Salvar' : 'Cadastrar'}
          loading={salvar.isPending}
          disabled={!form.nome.trim() || !form.grupos_musculares_ids.length || !form.modalidades.length}
          onPress={() => {
            setErro(null)
            salvar.mutate()
          }}
        />
      </View>
    </View>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <SectionHeader title={titulo} />
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  )
}

import { CalendarDays, ChevronRight, Sparkles } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { diasSemanaTexto, resumoAlvos } from '../lib/format'
import { colors } from '../lib/theme'
import type { Exercicio, OrigemPlano } from '../types/domain'
import type { TreinoItem, TreinoResumo } from '../types/treinos'
import { ExercicioMidia, midiaExercicio } from './ExercicioMidia'
import { Button } from './ui'
import { BottomSheet } from './ui/BottomSheet'

/** Imagem do exercício para listas e detalhes (GIF do catálogo; ver ExercicioMidia). */
export function miniaturaExercicio(e: Exercicio): string | null {
  return midiaExercicio(e)
}

/** Selo "Manual" / "IA" dos cartões e do detalhe. */
export function BadgeOrigem({ origem }: { origem: OrigemPlano }) {
  const ia = origem === 'gerado_automatico'
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-3 py-1 ${ia ? 'bg-primary' : 'bg-primary/15'}`}>
      {ia && <Sparkles size={12} color="#fff" />}
      <Text className={`font-bold text-xs ${ia ? 'text-white' : 'text-primary'}`}>{ia ? 'Gerado por IA' : 'Manual'}</Text>
    </View>
  )
}

/** Cartão da lista de treinos (Meus / IA): mesmo componente, a origem só muda o selo. */
export function TreinoCard({ treino, onPress, destaque }: { treino: TreinoResumo; onPress: () => void; destaque?: string }) {
  return (
    <Pressable onPress={onPress} className="gap-3 rounded-3xl bg-surface p-5 active:opacity-80 dark:bg-surface-dark">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="font-bold text-xl text-ink dark:text-ink-dark" numberOfLines={2}>
            {treino.nome}
          </Text>
          <Text className="font-medium text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
            {treino.grupos_musculares.join(' · ') || 'Sem exercícios ainda'}
          </Text>
        </View>
        <ChevronRight size={22} color={colors.primary} />
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <BadgeOrigem origem={treino.origem} />
        {destaque && (
          <View className="rounded-full bg-success/20 px-3 py-1">
            <Text className="font-bold text-xs text-success">{destaque}</Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <CalendarDays size={14} color={colors.primary} />
          <Text className="font-semibold text-xs text-muted dark:text-muted-dark">{diasSemanaTexto(treino.dias_semana)}</Text>
        </View>
        <Text className="font-semibold text-xs text-muted dark:text-muted-dark">· {treino.quantidade_exercicios} exercícios</Text>
      </View>
    </Pressable>
  )
}

/** Linha de exercício no formato "Workout Activity" do kit: miniatura, nome e alvos. */
export function ItemTreinoLinha({ item, posicao, direita, onPress }: { item: TreinoItem; posicao: number; direita?: ReactNode; onPress?: () => void }) {
  const thumb = miniaturaExercicio(item.exercicio)
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-row items-center gap-4 rounded-3xl bg-surface p-3 active:opacity-80 dark:bg-surface-dark">
      <ExercicioMidia uri={thumb} tamanho={64} raio={16} />
      <View className="flex-1 gap-1">
        <Text className="font-bold text-base text-ink dark:text-ink-dark" numberOfLines={2}>
          {posicao}. {item.exercicio.nome}
        </Text>
        <Text className="font-medium text-sm text-muted dark:text-muted-dark">{resumoAlvos(item)}</Text>
        {!item.exercicio_ativo && <Text className="font-semibold text-xs text-warning">Exercício desativado do catálogo</Text>}
      </View>
      {direita}
    </Pressable>
  )
}

/** Confirmação no estilo da folha inferior do kit ("Logout" / "Remove from Bookmark"). */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
  danger,
}: {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
  danger?: boolean
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} titleClassName={danger ? 'text-danger' : 'text-ink dark:text-ink-dark'}>
      <Text className="text-center font-semibold text-base text-ink dark:text-ink-dark">{message}</Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button title={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} />
        </View>
      </View>
    </BottomSheet>
  )
}

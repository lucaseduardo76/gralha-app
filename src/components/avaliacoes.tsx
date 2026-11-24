import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { colors } from '../lib/theme'
import type { AvaliacaoProgressoIa, AvaliacaoSessaoIa } from '../types/avaliacoes'

/** Cor da escala de dor: verde (0) → amarelo (5) → vermelho (10). */
export function corDaDor(nivel: number): string {
  if (nivel <= 3) return colors.success
  if (nivel <= 5) return colors.warning
  if (nivel <= 7) return '#FB923C'
  return colors.danger
}

/** Escala 0-10 em círculos tocáveis. */
export function SeletorDor({ valor, onChange }: { valor: number | null; onChange: (n: number) => void }) {
  return (
    <View className="gap-2">
      {/* Escala tipo NPS: 11 células que dividem a largura (cabe em telas de 320 px). */}
      <View className="flex-row" style={{ gap: 3 }}>
        {Array.from({ length: 11 }, (_, n) => {
          const ativo = valor === n
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              hitSlop={{ top: 6, bottom: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Dor ${n} de 10`}
              accessibilityState={{ selected: ativo }}
              style={{ backgroundColor: ativo ? corDaDor(n) : undefined, borderColor: corDaDor(n) }}
              className="h-11 flex-1 items-center justify-center rounded-xl border-2"
            >
              <Text className={`font-bold text-sm ${ativo ? 'text-white' : 'text-ink dark:text-ink-dark'}`}>{n}</Text>
            </Pressable>
          )
        })}
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted dark:text-muted-dark">Sem dor</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">Dor máxima</Text>
      </View>
    </View>
  )
}

function Lista({ titulo, itens, icon: Icon, cor }: { titulo: string; itens: string[] | null | undefined; icon: LucideIcon; cor: string }) {
  if (!itens || itens.length === 0) return null
  return (
    <View className="gap-2">
      <Text className="font-bold text-base text-ink dark:text-ink-dark">{titulo}</Text>
      {itens.map((item, i) => (
        <View key={i} className="flex-row gap-2">
          <Icon size={18} color={cor} style={{ marginTop: 2 }} />
          <Text className="flex-1 text-base leading-6 text-ink dark:text-ink-dark">{item}</Text>
        </View>
      ))}
    </View>
  )
}

function Cabecalho({ titulo }: { titulo: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Sparkles size={20} color={colors.primary} />
      <Text className="font-bold text-lg text-ink dark:text-ink-dark">{titulo}</Text>
    </View>
  )
}

export function CardAvaliacaoSessao({ avaliacao }: { avaliacao: AvaliacaoSessaoIa }) {
  return (
    <View className="gap-4 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
      <Cabecalho titulo="Avaliação da IA" />
      <Text className="text-base leading-6 text-ink dark:text-ink-dark">{avaliacao.resumo}</Text>
      <Lista titulo="O que foi bem" itens={avaliacao.pontos_positivos} icon={CheckCircle2} cor={colors.success} />
      <Lista titulo="Pontos de atenção" itens={avaliacao.pontos_de_atencao} icon={AlertTriangle} cor={colors.warning} />
      <Lista titulo="Para o próximo treino" itens={avaliacao.sugestao_proximo_treino ? [avaliacao.sugestao_proximo_treino] : null} icon={Lightbulb} cor={colors.primary} />
    </View>
  )
}

export function CardAvaliacaoProgresso({ avaliacao }: { avaliacao: AvaliacaoProgressoIa }) {
  return (
    <View className="gap-4 rounded-3xl bg-surface p-5 dark:bg-surface-dark">
      <Cabecalho titulo="Sua avaliação de progresso" />
      <Text className="text-base leading-6 text-ink dark:text-ink-dark">{avaliacao.resumo}</Text>
      <Lista titulo="Sua evolução" itens={avaliacao.evolucao} icon={TrendingUp} cor={colors.success} />
      <Lista titulo="Pontos de atenção" itens={avaliacao.pontos_de_atencao} icon={AlertTriangle} cor={colors.warning} />
      <Lista titulo="Para os próximos 30 dias" itens={avaliacao.recomendacoes} icon={Lightbulb} cor={colors.primary} />
      {avaliacao.mensagem_final ? (
        <Text className="text-center font-semibold text-base text-primary">{avaliacao.mensagem_final}</Text>
      ) : null}
    </View>
  )
}

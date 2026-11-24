import { useNavigation, type NavigationProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Eye, KeyRound, LogOut, Pencil, Sparkles, Trash2, TrendingUp, Trophy, User, type LucideIcon } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { excluirConta, getResumo } from '../../api/usuarios'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { AppHeader, Button, Divider, Screen } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { toApiError } from '../../lib/api'
import { dataCurta, iniciais, kg } from '../../lib/format'
import { APP_VERSION } from '../../lib/versao'
import { colors } from '../../lib/theme'
import type { AppStackParams } from '../../navigation/types'

export function PerfilScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParams>>()
  const { usuario, isAdmin, logout, encerrarSessaoLocal } = useAuth()
  const { theme, toggleTheme, palette } = useTheme()
  const [sheet, setSheet] = useState<'logout' | 'excluir' | null>(null)
  const [processando, setProcessando] = useState(false)
  const resumo = useQuery({ queryKey: ['perfil-resumo'], queryFn: getResumo })
  const [erro, setErro] = useState<string | null>(null)

  const sair = async () => {
    setProcessando(true)
    await logout()
  }

  const excluir = async () => {
    setErro(null)
    setProcessando(true)
    try {
      await excluirConta()
      await encerrarSessaoLocal()
    } catch (e) {
      setErro(toApiError(e).message)
      setProcessando(false)
    }
  }

  return (
    <Screen>
      <AppHeader title="Perfil" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 40 }}>
        <View className="items-center gap-2">
          <View>
            <View className="h-28 w-28 items-center justify-center rounded-full bg-primary/20">
              <Text className="font-bold text-4xl text-primary">{iniciais(usuario?.nome)}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('EditarPerfil')}
              accessibilityLabel="Editar perfil"
              className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-lg bg-primary"
            >
              <Pencil size={16} color="#fff" />
            </Pressable>
          </View>
          <Text className="mt-2 font-bold text-2xl text-ink dark:text-ink-dark">{usuario?.nome}</Text>
          <Text className="font-medium text-base text-ink dark:text-ink-dark">{usuario?.email}</Text>
          {isAdmin && (
            <View className="mt-1 rounded-full bg-warning px-3 py-1">
              <Text className="font-bold text-xs text-black">ADMIN</Text>
            </View>
          )}
        </View>

        {resumo.data && (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Numero valor={String(resumo.data.total_sessoes)} rotulo="Treinos" />
              <Numero valor={String(resumo.data.sessoes_no_mes)} rotulo="No mês" />
              <Numero valor={`${resumo.data.sequencia_semanas} sem.`} rotulo="Sequência" />
            </View>
            <Text className="text-center font-medium text-sm text-muted dark:text-muted-dark">
              {kg(resumo.data.volume_total_kg)} kg levantados{resumo.data.ultima_sessao_em ? ` · último treino em ${dataCurta(resumo.data.ultima_sessao_em)}` : ''}
            </Text>
            {resumo.data.recordes_recentes.slice(0, 3).map((r) => (
              <View key={r.id} className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 dark:bg-surface-dark">
                <Trophy size={18} color={colors.warning} />
                <Text className="flex-1 font-semibold text-sm text-ink dark:text-ink-dark" numberOfLines={1}>
                  {r.exercicio.nome}
                </Text>
                <Text className="font-bold text-sm text-primary">
                  {kg(r.valor_recorde)} {r.unidade}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Divider />

        <View className="gap-1">
          <MenuItem icon={User} label="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} />
          <MenuItem icon={TrendingUp} label="Avaliação de progresso (IA)" onPress={() => navigation.navigate('AvaliacaoProgresso')} />
          <MenuItem icon={Sparkles} label="Minhas respostas para a IA" onPress={() => navigation.navigate('IaQuestionario', { modo: 'editar' })} />
          <MenuItem icon={KeyRound} label="Alterar senha" onPress={() => navigation.navigate('AlterarSenha')} />
          <MenuItem
            icon={Eye}
            label="Tema escuro"
            right={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ true: colors.primary, false: palette.elevated }}
                thumbColor="#fff"
              />
            }
          />
          <MenuItem icon={LogOut} label="Sair" danger onPress={() => setSheet('logout')} />
          <MenuItem icon={Trash2} label="Excluir conta" danger onPress={() => setSheet('excluir')} />
        </View>
        <Text className="text-center font-medium text-xs text-muted dark:text-muted-dark">GralhaFit v{APP_VERSION}</Text>
      </ScrollView>

      <BottomSheet visible={sheet === 'logout'} onClose={() => setSheet(null)} title="Sair" titleClassName="text-danger">
        <Text className="text-center font-bold text-lg text-ink dark:text-ink-dark">Tem certeza de que quer sair?</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancelar" variant="secondary" onPress={() => setSheet(null)} />
          </View>
          <View className="flex-1">
            <Button title="Sim, sair" onPress={sair} loading={processando} />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'excluir'} onClose={() => setSheet(null)} title="Excluir conta" titleClassName="text-danger">
        <Text className="text-center font-medium text-base text-ink dark:text-ink-dark">
          Todos os seus dados — treinos, histórico e perfil — serão apagados de forma permanente. Não é possível desfazer.
        </Text>
        {erro && <Text className="text-center font-semibold text-sm text-danger">{erro}</Text>}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancelar" variant="secondary" onPress={() => setSheet(null)} />
          </View>
          <View className="flex-1">
            <Button title="Excluir" variant="danger" onPress={excluir} loading={processando} />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  )
}

function MenuItem({ icon: Icon, label, onPress, right, danger }: { icon: LucideIcon; label: string; onPress?: () => void; right?: ReactNode; danger?: boolean }) {
  const { palette } = useTheme()
  const cor = danger ? colors.danger : palette.ink
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="h-14 flex-row items-center gap-5 active:opacity-70">
      <Icon size={24} color={cor} />
      <Text className={`flex-1 font-semibold text-lg ${danger ? 'text-danger' : 'text-ink dark:text-ink-dark'}`}>{label}</Text>
      {right ?? (!danger && <ChevronRight size={20} color={palette.muted} />)}
    </Pressable>
  )
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-2xl bg-surface py-4 dark:bg-surface-dark">
      <Text className="font-bold text-2xl text-primary">{valor}</Text>
      <Text className="font-medium text-xs text-muted dark:text-muted-dark">{rotulo}</Text>
    </View>
  )
}

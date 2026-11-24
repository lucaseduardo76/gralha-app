import { Check, Dumbbell, Eye, EyeOff, type LucideIcon } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { colors } from '../../lib/theme'

// Componentes base no estilo do kit Gofit: fundo quase preto, cartões #1F222A, botões em pílula roxos,
// raio grande e tipografia Urbanist.

export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background dark:bg-background-dark">
      {children}
    </SafeAreaView>
  )
}

/** Quadrado roxo com halter: a "marca" que abre o cabeçalho das telas principais. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3 }} className="items-center justify-center bg-primary">
      <Dumbbell size={size * 0.6} color="#fff" />
    </View>
  )
}

export function AppHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
      <View className="flex-row items-center gap-4">
        <BrandMark />
        <Text className="font-bold text-2xl text-ink dark:text-ink-dark">{title}</Text>
      </View>
      {right}
    </View>
  )
}

export function IconButton({ icon: Icon, onPress, label }: { icon: LucideIcon; onPress: () => void; label: string }) {
  const { palette } = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={12} className="p-1">
      <Icon size={26} color={palette.ink} />
    </Pressable>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon: Icon,
  small,
}: {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  icon?: LucideIcon
  small?: boolean
}) {
  const inativo = disabled || loading
  const base = small ? 'h-10 px-5' : 'h-14 px-6'
  const estilos: Record<ButtonVariant, string> = {
    primary: inativo ? 'bg-primary-muted' : 'bg-primary',
    secondary: 'bg-primary-tint dark:bg-elevated-dark',
    outline: 'border-2 border-primary',
    danger: 'bg-danger',
  }
  const corTexto = variant === 'outline' || variant === 'secondary' ? 'text-primary dark:text-white' : 'text-white'
  const corIcone = variant === 'outline' ? colors.primary : '#fff'
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      style={variant === 'primary' && !inativo ? { shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : undefined}
      className={`${base} flex-row items-center justify-center gap-2 rounded-full active:opacity-80 ${estilos[variant]}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {Icon && <Icon size={18} color={corIcone} />}
          <Text className={`font-bold ${small ? 'text-sm' : 'text-base'} ${corTexto}`}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function TextField({
  icon: Icon,
  error,
  secure,
  ...props
}: TextInputProps & { icon?: LucideIcon; error?: string; secure?: boolean }) {
  const { palette } = useTheme()
  const [focado, setFocado] = useState(false)
  const [oculto, setOculto] = useState(true)
  const cor = focado ? colors.primary : palette.muted
  return (
    <View className="gap-1">
      <View
        className={`h-14 flex-row items-center gap-3 rounded-2xl border px-5 ${
          focado ? 'border-primary bg-primary-tint/40 dark:bg-primary/10' : 'border-transparent bg-surface dark:bg-surface-dark'
        } ${error ? 'border-danger' : ''}`}
      >
        {Icon && <Icon size={20} color={cor} />}
        <TextInput
          {...props}
          secureTextEntry={secure && oculto}
          placeholderTextColor={palette.muted}
          onFocus={(e) => {
            setFocado(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocado(false)
            props.onBlur?.(e)
          }}
          className="flex-1 font-semibold text-base text-ink dark:text-ink-dark"
        />
        {secure && (
          <Pressable onPress={() => setOculto((v) => !v)} hitSlop={10} accessibilityLabel={oculto ? 'Mostrar senha' : 'Ocultar senha'}>
            {oculto ? <EyeOff size={20} color={cor} /> : <Eye size={20} color={cor} />}
          </Pressable>
        )}
      </View>
      {error ? <Text className="ml-2 font-medium text-sm text-danger">{error}</Text> : null}
    </View>
  )
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-9 items-center justify-center rounded-full border-2 border-primary px-5 ${active ? 'bg-primary' : ''}`}
    >
      <Text className={`font-semibold text-sm ${active ? 'text-white' : 'text-primary'}`}>{label}</Text>
    </Pressable>
  )
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-bold text-xl text-ink dark:text-ink-dark">{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="font-bold text-base text-primary">{action}</Text>
        </Pressable>
      )}
    </View>
  )
}

/** Opção selecionável dos questionários (tela "What is Your Goal?" do kit). */
export function OptionCard({ label, selected, onPress, multi }: { label: string; selected: boolean; onPress: () => void; multi?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-16 flex-row items-center justify-between rounded-2xl border-2 bg-surface px-6 dark:bg-surface-dark ${
        selected ? 'border-primary' : 'border-transparent'
      }`}
    >
      <Text className="font-semibold text-lg text-ink dark:text-ink-dark">{label}</Text>
      <View
        className={`h-6 w-6 items-center justify-center border-2 border-primary ${multi ? 'rounded-md' : 'rounded-full'} ${
          selected ? 'bg-primary' : ''
        }`}
      >
        {selected && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  )
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

export function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message?: string; action?: ReactNode }) {
  return (
    <View className="items-center gap-3 px-8 py-12">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/15">
        <Icon size={36} color={colors.primary} />
      </View>
      <Text className="text-center font-bold text-xl text-ink dark:text-ink-dark">{title}</Text>
      {message && <Text className="text-center font-medium text-base text-muted dark:text-muted-dark">{message}</Text>}
      {action && <View className="mt-2 self-stretch">{action}</View>}
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text className="text-center font-semibold text-base text-muted dark:text-muted-dark">{message}</Text>
      <Button title="Tentar de novo" variant="outline" small onPress={onRetry} />
    </View>
  )
}

export function Divider() {
  return <View className="h-px bg-edge dark:bg-edge-dark" />
}

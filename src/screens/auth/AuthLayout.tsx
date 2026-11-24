import { useNavigation } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Screen } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'

/** Moldura das telas de autenticação: voltar, título grande e conteúdo rolável acima do teclado. */
export function AuthLayout({ title, subtitle, children, footer }: { title?: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const navigation = useNavigation()
  const { palette } = useTheme()
  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View className="h-14 justify-center">
          {navigation.canGoBack() && (
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Voltar">
              <ArrowLeft size={26} color={palette.ink} />
            </Pressable>
          )}
        </View>
        {title && <Text className="mb-3 mt-6 font-bold text-5xl leading-[56px] text-ink dark:text-ink-dark">{title}</Text>}
        {subtitle && <Text className="mb-2 font-medium text-base text-muted dark:text-muted-dark">{subtitle}</Text>}
        <View className="mt-6 flex-1 gap-5">{children}</View>
        {footer && <View className="mt-8">{footer}</View>}
      </KeyboardAwareScrollView>
    </Screen>
  )
}

export function FooterLink({ text, link, onPress }: { text: string; link: string; onPress: () => void }) {
  return (
    <View className="flex-row justify-center gap-2">
      <Text className="font-medium text-sm text-muted dark:text-muted-dark">{text}</Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text className="font-bold text-sm text-primary">{link}</Text>
      </Pressable>
    </View>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <View className="rounded-2xl bg-danger/10 px-4 py-3">
      <Text className="font-semibold text-sm text-danger">{message}</Text>
    </View>
  )
}

import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/** Folha inferior do kit (modal de logout / remover favorito): alça, título colorido, divisória e ações lado a lado. */
export function BottomSheet({
  visible,
  onClose,
  title,
  titleClassName = 'text-ink dark:text-ink-dark',
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  titleClassName?: string
  children: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* Sobe junto com o teclado quando a folha tem campo de texto. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <Pressable onPress={onClose} className="flex-1 bg-black/60" accessibilityLabel="Fechar" />
        <View style={{ paddingBottom: insets.bottom + 24 }} className="gap-5 rounded-t-[40px] bg-background px-6 pt-3 dark:bg-surface-dark">
          <View className="h-1 w-10 self-center rounded-full bg-elevated dark:bg-elevated-dark" />
          <Text className={`text-center font-bold text-2xl ${titleClassName}`}>{title}</Text>
          <View className="h-px bg-edge dark:bg-edge-dark" />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

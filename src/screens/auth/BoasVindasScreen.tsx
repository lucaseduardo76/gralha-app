import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'
import { BrandMark, Button, Screen } from '../../components/ui'
import type { AuthStackParams } from '../../navigation/types'
import { FooterLink } from './AuthLayout'

export function BoasVindasScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'BoasVindas'>) {
  return (
    <Screen edges={['top', 'bottom']}>
      <LinearGradient colors={['rgba(114,89,240,0.35)', 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420 }} />
      <View className="flex-1 justify-between px-6 pb-6">
        <View className="flex-1 items-center justify-center gap-6">
          <BrandMark size={96} />
          <Text className="text-center font-bold text-5xl text-ink dark:text-ink-dark">GralhaFit</Text>
          <Text className="px-4 text-center font-medium text-lg text-muted dark:text-muted-dark">
            Planeje, execute e acompanhe seus treinos — do seu jeito ou com a ajuda da IA.
          </Text>
        </View>
        <View className="gap-6">
          <Button title="Entrar com senha" onPress={() => navigation.navigate('Login')} />
          <Button title="Criar conta" variant="secondary" onPress={() => navigation.navigate('Cadastro')} />
          <FooterLink text="Esqueceu a senha?" link="Recuperar" onPress={() => navigation.navigate('EsqueciSenha')} />
        </View>
      </View>
    </Screen>
  )
}

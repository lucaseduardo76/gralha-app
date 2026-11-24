import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BookOpen, ClipboardList, House, User, type LucideIcon } from 'lucide-react-native'
import { Loading, Screen } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { colors } from '../lib/theme'
import { BoasVindasScreen } from '../screens/auth/BoasVindasScreen'
import { CadastroScreen } from '../screens/auth/CadastroScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { CodigoSenhaScreen, EsqueciSenhaScreen, SenhaRedefinidaScreen } from '../screens/auth/RecuperarSenhaScreens'
import { CatalogoScreen, ExercicioDetalheScreen } from '../screens/catalogo/CatalogoScreens'
import { ExercicioFormScreen } from '../screens/catalogo/ExercicioFormScreen'
import { HojeScreen } from '../screens/hoje/HojeScreen'
import { AlterarSenhaScreen, EditarPerfilScreen } from '../screens/perfil/EditarPerfilScreens'
import { PerfilScreen } from '../screens/perfil/PerfilScreen'
import { IaGerandoScreen, IaQuestionarioScreen, IaRedefinirScreen } from '../screens/ia/IaScreens'
import { ResultadosScreen, SessaoDetalheScreen } from '../screens/resultados/ResultadosScreen'
import { ResumoSessaoScreen } from '../screens/sessao/ResumoSessaoScreen'
import { AvaliacaoProgressoScreen } from '../screens/avaliacao/AvaliacaoProgressoScreen'
import { SessaoScreen } from '../screens/sessao/SessaoScreen'
import { TreinoDetalheScreen } from '../screens/treinos/TreinoDetalheScreen'
import { TreinoFormScreen } from '../screens/treinos/TreinoFormScreen'
import { TreinosScreen } from '../screens/treinos/TreinosScreen'
import type { AppStackParams, AuthStackParams, TabsParams } from './types'

const AuthStack = createNativeStackNavigator<AuthStackParams>()
const AppStack = createNativeStackNavigator<AppStackParams>()
const Tabs = createBottomTabNavigator<TabsParams>()

const tabIcon = (Icon: LucideIcon) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Icon size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : 'transparent'} fillOpacity={0.25} />
  }

function AppTabs() {
  const { palette } = useTheme()
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.background, borderTopColor: palette.edge, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: 'Urbanist_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="Hoje" component={HojeScreen} options={{ tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="Treinos" component={TreinosScreen} options={{ tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="Catalogo" component={CatalogoScreen} options={{ title: 'Exercícios', tabBarIcon: tabIcon(BookOpen) }} />
      <Tabs.Screen name="Perfil" component={PerfilScreen} options={{ tabBarIcon: tabIcon(User) }} />
    </Tabs.Navigator>
  )
}

export function RootNavigator() {
  const { usuario, isLoading } = useAuth()
  const { palette } = useTheme()

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  const stackOptions = {
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.ink,
    headerTitleStyle: { fontFamily: 'Urbanist_700Bold', fontSize: 20 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: palette.background },
  }

  if (!usuario) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <AuthStack.Screen name="BoasVindas" component={BoasVindasScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Cadastro" component={CadastroScreen} />
        <AuthStack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
        <AuthStack.Screen name="CodigoSenha" component={CodigoSenhaScreen} />
        <AuthStack.Screen name="SenhaRedefinida" component={SenhaRedefinidaScreen} />
      </AuthStack.Navigator>
    )
  }

  return (
    <AppStack.Navigator screenOptions={stackOptions}>
      <AppStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="ExercicioDetalhe" component={ExercicioDetalheScreen} options={({ route }) => ({ title: route.params.nome })} />
      <AppStack.Screen name="ExercicioForm" component={ExercicioFormScreen} options={{ title: 'Exercício' }} />
      <AppStack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: 'Editar perfil' }} />
      <AppStack.Screen name="AlterarSenha" component={AlterarSenhaScreen} options={{ title: 'Alterar senha' }} />
      <AppStack.Screen name="TreinoDetalhe" component={TreinoDetalheScreen} options={{ title: 'Treino' }} />
      <AppStack.Screen name="TreinoForm" component={TreinoFormScreen} options={{ title: 'Novo treino' }} />
      <AppStack.Screen name="Sessao" component={SessaoScreen} options={{ title: 'Treino', gestureEnabled: false }} />
      <AppStack.Screen name="ResumoSessao" component={ResumoSessaoScreen} options={{ title: 'Treino concluído', headerBackVisible: false, gestureEnabled: false }} />
      <AppStack.Screen name="SessaoDetalhe" component={SessaoDetalheScreen} options={{ title: 'Sessão' }} />
      <AppStack.Screen name="Resultados" component={ResultadosScreen} options={{ title: 'Resultados' }} />
      <AppStack.Screen name="IaQuestionario" component={IaQuestionarioScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <AppStack.Screen name="IaGerando" component={IaGerandoScreen} options={{ title: 'IA', headerBackVisible: false, gestureEnabled: false }} />
      <AppStack.Screen name="IaRedefinir" component={IaRedefinirScreen} options={{ title: 'Ajustar com a IA' }} />
      <AppStack.Screen name="AvaliacaoProgresso" component={AvaliacaoProgressoScreen} options={{ title: 'Avaliação de progresso' }} />
    </AppStack.Navigator>
  )
}

import type { NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParams = {
  BoasVindas: undefined
  Login: undefined
  Cadastro: undefined
  EsqueciSenha: undefined
  CodigoSenha: { email: string }
  SenhaRedefinida: undefined
}

export type TabsParams = {
  Hoje: undefined
  Treinos: undefined
  Catalogo: undefined
  Perfil: undefined
}

export type AppStackParams = {
  Tabs: NavigatorScreenParams<TabsParams>
  ExercicioDetalhe: { id: string; nome: string }
  ExercicioForm: { id?: string }
  EditarPerfil: undefined
  AlterarSenha: undefined
  TreinoDetalhe: { id: string }
  TreinoForm: { id?: string }
  /** Sessão: `treinoId` para iniciar; sem ele, retoma a que está em andamento. */
  Sessao: { treinoId?: string }
  ResumoSessao: { sessaoId: string }
  SessaoDetalhe: { id: string }
  Resultados: { treinoId: string; nome: string }
  /** modo 'editar' (perfil): só salva as respostas, sem gerar. */
  IaQuestionario: { modo?: 'editar' } | undefined
  IaGerando: { geracaoId: string }
  IaRedefinir: { planoId: string }
  AvaliacaoProgresso: undefined
}

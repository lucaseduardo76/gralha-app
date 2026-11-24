export type TipoPergunta = 'unica' | 'multipla' | 'numero' | 'texto'

export interface OpcaoPergunta {
  valor: string
  label: string
}

/** Pergunta do GET /ia/questionario: o app renderiza dinamicamente pelo `tipo`. */
export interface PerguntaIa {
  id: string
  titulo: string
  descricao: string | null
  tipo: TipoPergunta
  obrigatoria: boolean
  opcoes: OpcaoPergunta[]
  min: number | null
  max: number | null
  /** Resposta atual (pré-preenchida pelo perfil): string, string[], number ou null. */
  resposta: RespostaIa
}

export type RespostaIa = string | string[] | number | null

export interface QuestionarioIa {
  perguntas: PerguntaIa[]
}

export type StatusGeracao = 'PENDENTE' | 'CONCLUIDA' | 'FALHOU'

export interface GeracaoIa {
  geracao_id: string
  status: StatusGeracao
  plan_id: string | null
  erro: string | null
}

/** GET /ia/planos/{id} */
export interface PlanoIa {
  id: string
  nome: string
  ativo: boolean
  redefinicoes_usadas: number
  redefinicoes_restantes: number
}

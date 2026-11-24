/** Pós-treino (dor e troca de exercícios) e avaliações da IA (treino e progresso). */

export interface Substituicao {
  exercicio_id: string
  exercicio_nome: string
  substituto_id: string | null
  substituto_nome: string | null
  motivo: string
}

export interface DorSessaoResposta {
  sessao_id: string
  nivel_dor: number
  substituicoes: Substituicao[]
}

export interface AvaliacaoSessaoIa {
  resumo: string
  pontos_positivos: string[] | null
  pontos_de_atencao: string[] | null
  sugestao_proximo_treino: string | null
}

export interface AvaliacaoSessao {
  sessao_id: string
  avaliacao: AvaliacaoSessaoIa
  gerada_em: string
}

export interface AvaliacaoProgressoIa {
  resumo: string
  evolucao: string[] | null
  pontos_de_atencao: string[] | null
  recomendacoes: string[] | null
  mensagem_final: string | null
}

export interface AvaliacaoProgresso {
  id: string
  avaliacao: AvaliacaoProgressoIa
  sessoes_analisadas: number
  periodo_inicio: string
  periodo_fim: string
  criada_em: string
}

export interface StatusAvaliacaoProgresso {
  disponivel: boolean
  proxima_disponivel_em: string | null
  sessoes_finalizadas: number
  sessoes_minimas: number
  ultima: AvaliacaoProgresso | null
}

/** Acima disso o app pede os exercícios que mais doeram (mesmo limite do backend). */
export const LIMITE_DOR = 5

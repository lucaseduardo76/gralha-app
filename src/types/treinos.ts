import type { Exercicio, Modalidade, OrigemPlano } from './domain'

/** Dias da semana ISO: 1 = segunda … 7 = domingo. */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** GET /treinos (cartão da lista). */
export interface TreinoResumo {
  id: string
  plano_id: string
  nome: string
  origem: OrigemPlano
  editavel: boolean
  modalidade: Modalidade
  dias_semana: number[]
  quantidade_exercicios: number
  grupos_musculares: string[]
}

export interface TreinoItem {
  id: string
  ordem: number
  series_alvo: number | null
  repeticoes_alvo: number | null
  carga_alvo_kg: number | null
  descanso_alvo_seg: number | null
  distancia_alvo_km: number | null
  duracao_alvo_seg: number | null
  observacoes: string | null
  exercicio_ativo: boolean
  exercicio: Exercicio
}

/** GET /treinos/{id} */
export interface Treino {
  id: string
  plano_id: string
  nome: string
  origem: OrigemPlano
  editavel: boolean
  modalidade: Modalidade
  dias_semana: number[]
  copiado_de_id: string | null
  created_at: string
  itens: TreinoItem[]
}

export interface TreinoItemRequest {
  id?: string
  exercicio_id: string
  series_alvo?: number | null
  repeticoes_alvo?: number | null
  carga_alvo_kg?: number | null
  descanso_alvo_seg?: number | null
  distancia_alvo_km?: number | null
  duracao_alvo_seg?: number | null
  observacoes?: string | null
}

/** POST /treinos e PUT /treinos/{id} (o PUT substitui a lista de itens inteira). */
export interface TreinoRequest {
  nome: string
  modalidade?: Modalidade
  dias_semana: number[]
  itens: TreinoItemRequest[]
}

import type { Metrica, OrigemPlano, Recorde } from './domain'
import type { Treino } from './treinos'

export type StatusSessao = 'EM_ANDAMENTO' | 'FINALIZADA' | 'DESCARTADA'

/** Item planejado no início da sessão (snapshot: não muda se o treino for editado). */
export interface ItemSnapshot {
  prescricao_id: string | null
  exercicio_id: string
  nome: string
  metrica: Metrica
  ordem: number
  series_alvo: number | null
  repeticoes_alvo: number | null
  carga_alvo_kg: number | null
  descanso_alvo_seg: number | null
  distancia_alvo_km: number | null
  duracao_alvo_seg: number | null
  thumbnail_url: string | null
}

export interface Serie {
  exercicio_id: string
  prescricao_id: string | null
  numero_serie: number
  carga_kg: number | null
  repeticoes: number | null
  duracao_seg: number | null
  distancia_km: number | null
  concluida: boolean
}

export interface UltimoResultado {
  sessao_id: string
  data: string
  series: Serie[]
}

export interface Sessao {
  id: string
  treino_id: string | null
  nome_treino: string
  origem: OrigemPlano
  status: StatusSessao
  iniciada_em: string
  finalizada_em: string | null
  duracao_min: number | null
  itens: ItemSnapshot[]
  series: Serie[]
  ultimo_resultado: Record<string, UltimoResultado>
}

export type SerieRequest = Omit<Serie, 'prescricao_id'> & { prescricao_id?: string | null }

export interface ResumoSessao {
  sessao: Sessao
  volume_total_kg: number
  series_concluidas: number
  exercicios_feitos: number
  novos_recordes: Recorde[]
}

/** GET /hoje */
export interface HojeTreinos {
  data: string
  dia_semana: number
  treinos_do_dia: { treino: Treino; concluido_hoje: boolean; ultima_sessao_em: string | null }[]
  sessao_em_andamento: { id: string; treino_id: string | null; nome_treino: string; iniciada_em: string } | null
  sessoes_na_semana: number
  ultimo_resultado_por_exercicio: Record<string, UltimoResultado>
  recordes_recentes: Recorde[]
}

export type Periodo = '30d' | '90d' | '180d' | '1a' | 'tudo'

export interface PontoResultado {
  sessao_id: string
  data: string
  carga_maxima_kg: number | null
  volume_kg: number | null
  e1rm_kg: number | null
  repeticoes_max: number | null
  series: number
}

/** GET /treinos/{id}/resultados */
export interface ResultadosTreino {
  treino: { id: string; nome: string; origem: OrigemPlano }
  periodo: Periodo
  exercicios: { id: string; nome: string; metrica: Metrica; no_treino_atual: boolean }[]
  series_por_exercicio: { exercicio_id: string; pontos: PontoResultado[] }[]
  volume_total_por_sessao: { sessao_id: string; data: string; volume_kg: number; duracao_min: number | null; series: number }[]
  sessoes: {
    id: string
    data: string
    duracao_min: number | null
    volume_kg: number
    series: { exercicio_id: string; exercicio_nome: string; numero_serie: number | null; carga_kg: number | null; repeticoes: number | null; duracao_seg: number | null; distancia_km: number | null }[]
  }[]
}

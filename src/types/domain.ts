// DTOs do gralha-back (JSON snake_case). Enums no "wire" do banco.

export type Modalidade = 'musculacao' | 'funcional_calistenia' | 'corrida_cardio' | 'mobilidade'
export type Equipamento = 'peso_corporal' | 'halteres' | 'barra' | 'maquina' | 'elastico'
export type Metrica = 'peso_reps' | 'distancia_tempo' | 'sustentacao'
export type OrigemPlano = 'gerado_automatico' | 'manual'
export type RegiaoCorpo = 'ombros' | 'cotovelos' | 'joelhos' | 'quadris' | 'coluna'

/** GET /usuarios/me */
export interface Perfil {
  id: string
  nome: string
  data_nascimento: string | null
  genero: 'masculino' | 'feminino' | 'outro' | null
  altura_cm: number | null
  peso_kg: number | null
  meta_peso_kg: number | null
  percentual_gordura_percebido: string | null
  created_at: string
  updated_at: string
  email?: string | null
  role?: 'USUARIO' | 'ADMIN' | null
}

export type PerfilRequest = Omit<Perfil, 'id' | 'created_at' | 'updated_at' | 'email' | 'role'>

export interface GrupoMuscular {
  id: number
  nome: string
}

export interface Exercicio {
  id: string
  nome: string
  descricao: string | null
  metrica: Metrica
  video_url_male: string | null
  video_url_female: string | null
  thumbnail_url_male: string | null
  thumbnail_url_female: string | null
  grupos_musculares: GrupoMuscular[]
  modalidades: Modalidade[]
  equipamentos: Equipamento[]
  conflitos_lesao: RegiaoCorpo[]
  instrucoes: string | null
  /** false = desativado do catálogo (some da busca, continua em treinos e históricos). */
  ativo: boolean
}

export interface Prescricao {
  id: string
  workout_day_id: string
  exercise_id: string
  ordem: number
  series_alvo: number | null
  repeticoes_alvo: number | null
  descanso_alvo_seg: number | null
  distancia_alvo_km: number | null
  duracao_alvo_seg: number | null
  observacoes: string | null
  exercicio: Exercicio
}

export interface DiaTreino {
  id: string
  plan_id: string
  nome_dia: string
  modalidade: Modalidade
  ordem_na_semana: number
  exercicios: Prescricao[]
}

export interface PlanoResumo {
  id: string
  nome: string
  origem: OrigemPlano
  data_inicio: string
  semana_atual: number
  ativo: boolean
}

export interface Recorde {
  id: string
  exercise_id: string
  valor_recorde: number
  unidade: string
  data_recorde: string
  exercicio: { id: string; nome: string }
}

/** GET /usuarios/me/hoje (BFF da tela inicial). */
export interface Hoje {
  data: string
  perfil: Perfil
  plano: PlanoResumo | null
  dia_sugerido: DiaTreino | null
  origem_dia_sugerido: 'executado_hoje' | 'proximo_apos_ultimo_executado' | 'primeiro_dia' | null
  concluido_hoje: boolean
  lesoes_ativas: RegiaoCorpo[]
  recordes_recentes: Recorde[]
}

export const EQUIPAMENTO_LABEL: Record<Equipamento, string> = {
  peso_corporal: 'Peso corporal',
  halteres: 'Halteres',
  barra: 'Barra',
  maquina: 'Máquina',
  elastico: 'Elástico',
}

export type MetricaLabel = Record<Metrica, string>
export const METRICA_LABEL: MetricaLabel = { peso_reps: 'Carga e repetições', distancia_tempo: 'Distância e tempo', sustentacao: 'Sustentação (tempo)' }

export const REGIAO_LABEL: Record<RegiaoCorpo, string> = { ombros: 'Ombros', cotovelos: 'Cotovelos', joelhos: 'Joelhos', quadris: 'Quadris', coluna: 'Coluna' }

/** POST/PUT /admin/exercicios */
export interface ExercicioAdminRequest {
  nome: string
  descricao: string | null
  instrucoes: string | null
  metrica: Metrica
  grupos_musculares_ids: number[]
  modalidades: Modalidade[]
  equipamentos: Equipamento[]
  conflitos_lesao: RegiaoCorpo[]
  video_url_male: string | null
  video_url_female: string | null
  thumbnail_url_male: string | null
  thumbnail_url_female: string | null
}

/** GET /usuarios/me/resumo */
export interface ResumoUsuario {
  total_sessoes: number
  sessoes_no_mes: number
  sequencia_semanas: number
  volume_total_kg: number
  ultima_sessao_em: string | null
  recordes_recentes: Recorde[]
}

/** GET /app/version */
export interface AppVersion {
  min_version: string | null
  latest_version: string | null
  store_url_android: string | null
  store_url_ios: string | null
}

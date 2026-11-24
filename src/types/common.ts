export interface ApiError {
  status?: number
  message: string
  description?: string
  fieldErrors?: Record<string, string>
  /** Corpo bruto da resposta (ex.: 409 com `sessao_id` ou `geracao_id`). */
  data?: Record<string, unknown>
}

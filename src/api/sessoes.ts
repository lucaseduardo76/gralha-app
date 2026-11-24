import { api } from '../lib/api'
import type { HojeTreinos, Periodo, ResultadosTreino, ResumoSessao, SerieRequest, Sessao } from '../types/sessoes'

export const getHojeTreinos = async () => (await api.get<HojeTreinos>('/hoje')).data

/** Idempotente pelo id (gerado no app). 409 → `{ message, sessao_id }` da sessão em andamento. */
export const iniciarSessao = async (id: string, treinoId: string) =>
  (await api.post<Sessao>('/sessoes', { id, treino_id: treinoId })).data

/** 200 com a sessão ou 204 (null) quando não há. */
export async function getSessaoEmAndamento(): Promise<Sessao | null> {
  const r = await api.get<Sessao | ''>('/sessoes/em-andamento')
  return r.status === 204 || !r.data ? null : r.data
}

export const getSessao = async (id: string) => (await api.get<Sessao>(`/sessoes/${id}`)).data

export const salvarSeries = async (id: string, series: SerieRequest[]) =>
  (await api.put<Sessao>(`/sessoes/${id}/series`, { series })).data

export const finalizarSessao = async (id: string) => (await api.post<ResumoSessao>(`/sessoes/${id}/finalizar`)).data

export async function descartarSessao(id: string): Promise<void> {
  await api.post(`/sessoes/${id}/descartar`)
}

export const getResultados = async (treinoId: string, periodo: Periodo) =>
  (await api.get<ResultadosTreino>(`/treinos/${treinoId}/resultados`, { params: { periodo } })).data

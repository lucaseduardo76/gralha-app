import { api } from '../lib/api'
import type { OrigemPlano } from '../types/domain'
import type { Treino, TreinoRequest, TreinoResumo } from '../types/treinos'

export const listarTreinos = async (origem?: OrigemPlano) =>
  (await api.get<TreinoResumo[]>('/treinos', { params: { origem } })).data

export const getTreino = async (id: string) => (await api.get<Treino>(`/treinos/${id}`)).data

export const criarTreino = async (body: TreinoRequest) => (await api.post<Treino>('/treinos', body)).data

export const atualizarTreino = async (id: string, body: TreinoRequest) => (await api.put<Treino>(`/treinos/${id}`, body)).data

export async function excluirTreino(id: string): Promise<void> {
  await api.delete(`/treinos/${id}`)
}

/** Duplica um manual ou copia um da IA para "Meus treinos". */
export const copiarTreino = async (id: string) => (await api.post<Treino>(`/treinos/${id}/copiar`)).data

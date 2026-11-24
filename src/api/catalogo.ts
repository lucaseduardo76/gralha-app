import { api } from '../lib/api'
import type { Equipamento, Exercicio, ExercicioAdminRequest, GrupoMuscular } from '../types/domain'

export interface FiltroExercicios {
  q?: string
  grupo_muscular_id?: number
  equipamento?: Equipamento
}

export async function listarExercicios(filtro: FiltroExercicios): Promise<Exercicio[]> {
  // Catálogo completo: o filtro de lesão (RD02) é para montar treino, não para consultar o catálogo.
  const params = { ...filtro, q: filtro.q?.trim() || undefined, respeitar_lesoes: false }
  return (await api.get<Exercicio[]>('/exercicios', { params })).data
}

export const getExercicio = async (id: string) => (await api.get<Exercicio>(`/exercicios/${id}`)).data

export const listarGruposMusculares = async () => (await api.get<GrupoMuscular[]>('/grupos-musculares')).data

// --- Admin (ROLE_ADMIN; usuário comum recebe 403) ---

export const listarExerciciosAdmin = async (filtro: FiltroExercicios & { incluir_inativos?: boolean }) =>
  (await api.get<Exercicio[]>('/admin/exercicios', { params: { ...filtro, q: filtro.q?.trim() || undefined } })).data

export const criarExercicio = async (body: ExercicioAdminRequest) => (await api.post<Exercicio>('/admin/exercicios', body)).data

export const atualizarExercicio = async (id: string, body: ExercicioAdminRequest) => (await api.put<Exercicio>(`/admin/exercicios/${id}`, body)).data

export const definirExercicioAtivo = async (id: string, ativo: boolean) => (await api.patch<Exercicio>(`/admin/exercicios/${id}/ativo`, { ativo })).data

export const excluirExercicio = async (id: string) =>
  (await api.delete<{ excluido: boolean; desativado: boolean; message: string }>(`/admin/exercicios/${id}`)).data

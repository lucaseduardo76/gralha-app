import { api } from '../lib/api'
import type { AvaliacaoProgresso, AvaliacaoSessao, DorSessaoResposta, StatusAvaliacaoProgresso } from '../types/avaliacoes'

/** Dor 0-10 do treino finalizado; acima de 5 com os exercícios que mais doeram (são trocados no treino). 409 = já informada. */
export const registrarDor = async (sessaoId: string, nivelDor: number, exerciciosIds: string[]) =>
  (await api.post<DorSessaoResposta>(`/sessoes/${sessaoId}/dor`, { nivel_dor: nivelDor, exercicios_ids: exerciciosIds })).data

/** Avaliação da IA sobre o treino (gerada uma vez; depois devolve a mesma). A IA pode levar alguns segundos. */
export const avaliarSessao = async (sessaoId: string) =>
  (await api.post<AvaliacaoSessao>(`/sessoes/${sessaoId}/avaliacao-ia`, undefined, { timeout: 120_000 })).data

export const getStatusAvaliacaoProgresso = async () =>
  (await api.get<StatusAvaliacaoProgresso>('/avaliacoes-progresso/status')).data

/** 1 a cada 30 dias (409 antes disso); exige 3 treinos finalizados nos últimos 90 dias (400). */
export const pedirAvaliacaoProgresso = async () =>
  (await api.post<AvaliacaoProgresso>('/avaliacoes-progresso', undefined, { timeout: 120_000 })).data

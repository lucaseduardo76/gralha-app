import { api } from '../lib/api'
import type { GeracaoIa, PlanoIa, QuestionarioIa, RespostaIa } from '../types/ia'

export const getQuestionario = async () => (await api.get<QuestionarioIa>('/ia/questionario')).data

/** 202 → geração assíncrona; 409 traz `geracao_id` da que já está em andamento. */
export const gerarTreinosIa = async (respostas: Record<string, RespostaIa>) =>
  (await api.post<GeracaoIa>('/ia/treinos/geracoes', { respostas })).data

export const getGeracao = async (id: string) => (await api.get<GeracaoIa>(`/ia/geracoes/${id}`)).data

export const getPlanoIa = async (id: string) => (await api.get<PlanoIa>(`/ia/planos/${id}`)).data

export const redefinirPlanoIa = async (planoId: string, pedido: string) =>
  (await api.post<GeracaoIa>(`/ia/planos/${planoId}/redefinicoes`, { pedido })).data

/** "Minhas respostas para a IA": grava no perfil sem gerar. */
export const salvarRespostasIa = async (respostas: Record<string, RespostaIa>) =>
  (await api.put<QuestionarioIa>('/ia/questionario', { respostas })).data

import { api } from '../lib/api'
import type { AppVersion, Hoje, Perfil, PerfilRequest, ResumoUsuario } from '../types/domain'

export const getPerfil = async () => (await api.get<Perfil>('/usuarios/me')).data

export const atualizarPerfil = async (body: PerfilRequest) => (await api.put<Perfil>('/usuarios/me', body)).data

export const getHoje = async () => (await api.get<Hoje>('/usuarios/me/hoje')).data

export async function excluirConta(): Promise<void> {
  await api.delete('/usuarios/me')
}

export const getResumo = async () => (await api.get<ResumoUsuario>('/usuarios/me/resumo')).data

export const getAppVersion = async () => (await api.get<AppVersion>('/app/version')).data

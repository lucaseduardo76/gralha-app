import axios from 'axios'
import { api, toApiError } from '../lib/api'
import { getApiUrl } from '../lib/env'
import type { AuthResponse } from '../types/auth'

// Rotas públicas usam axios "cru": um 401 de credencial errada não pode disparar o fluxo de refresh/sessão expirada.
const publicApi = axios.create({ timeout: 20_000, headers: { 'Content-Type': 'application/json' } })
publicApi.interceptors.request.use((config) => {
  config.baseURL = getApiUrl()
  return config
})

async function publico<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await fn()).data
  } catch (e) {
    throw toApiError(e)
  }
}

export const login = (email: string, senha: string) =>
  publico(() => publicApi.post<AuthResponse>('/authentication/login', { email, senha }))

export const register = (nome: string, email: string, senha: string) =>
  publico(() => publicApi.post<AuthResponse>('/authentication/register', { nome, email, senha }))

export const loginGoogle = (idToken: string) =>
  publico(() => publicApi.post<AuthResponse>('/authentication/google', { id_token: idToken }))

export const solicitarRecuperacao = (email: string) =>
  publico(() => publicApi.post<void>('/authentication/recuperar-senha', { email }))

export const confirmarRecuperacao = (email: string, codigo: string, novaSenha: string) =>
  publico(() => publicApi.post<void>('/authentication/recuperar-senha/confirmar', { email, codigo, nova_senha: novaSenha }))

export async function logout(refreshToken: string): Promise<void> {
  await publicApi.post('/authentication/logout', { refresh_token: refreshToken })
}

export async function alterarSenha(senhaAtual: string | null, novaSenha: string): Promise<void> {
  await api.put('/usuarios/me/senha', { senha_atual: senhaAtual, nova_senha: novaSenha })
}

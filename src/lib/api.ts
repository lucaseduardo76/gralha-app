import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/auth'
import type { ApiError } from '../types/common'
import { getApiUrl } from './env'
import { clearTokens, getAccessToken, getRefreshToken, isTokenExpired, saveTokens } from './token'

const listeners = new Set<() => void>()

/** Avisado quando a sessão morre (refresh recusado): o AuthContext volta para o login. */
export function onSessionExpired(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const api = axios.create({ timeout: 20_000, headers: { 'Content-Type': 'application/json' } })

// Um refresh por vez: chamadas concorrentes esperam a mesma promise. O backend rotaciona o refresh token e
// trata reuso como roubo (revoga tudo), então dois refresh paralelos com o mesmo token derrubariam a sessão.
let refreshing: Promise<string | null> | null = null

export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return null
    try {
      const { data } = await axios.post<AuthResponse>(`${getApiUrl()}/authentication/refresh`, { refresh_token: refreshToken })
      await saveTokens(data.access_token, data.refresh_token)
      return data.access_token
    } catch {
      return null
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

api.interceptors.request.use(async (config) => {
  // Lido a cada chamada: o endereço pode ser trocado na tela de login sem reiniciar o app.
  config.baseURL = getApiUrl()
  let token = await getAccessToken()
  if (token && isTokenExpired(token)) token = await refreshAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return error && typeof error === 'object' && 'message' in error ? (error as ApiError) : { message: 'Ocorreu um erro inesperado.' }
  }
  if (!error.response) return { message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' }
  const status = error.response.status
  const data: unknown = error.response.data
  if (data && typeof data === 'object') {
    if ('message' in data) {
      const body = data as { message: string; description?: string }
      return { status, message: body.message, description: body.description, data: data as Record<string, unknown> }
    }
    // Validação (400): mapa campo → mensagem.
    const fieldErrors = data as Record<string, string>
    return { status, message: Object.values(fieldErrors)[0] ?? 'Verifique os dados informados.', fieldErrors }
  }
  return { status, message: 'Ocorreu um erro inesperado.' }
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = toApiError(error)
    const config = axios.isAxiosError(error) ? (error.config as RetryableConfig | undefined) : undefined
    // Backend: token inválido/expirado = 401 (description TOKEN_INVALIDO); tenta um refresh e repete uma vez.
    if (apiError.status === 401 && config && !config._retried) {
      config._retried = true
      const token = await refreshAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      }
      await clearTokens()
      listeners.forEach((l) => l())
    }
    return Promise.reject(apiError)
  },
)

import AsyncStorage from '@react-native-async-storage/async-storage'

// Emulador Android: "localhost" não aponta pro host (use 10.0.2.2). Aparelho físico: IP da máquina na rede.
/** Endereço padrão, vindo do .env no momento do build. */
export const ENV_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

const STORAGE_KEY = 'gralhafit_api_url'

// Endereço configurado na tela de login (sobrescreve o do .env); null = usa o do .env.
let override: string | null = null

/** URL da API em uso agora: a configurada no app ou, se não houver, a do .env. */
export const getApiUrl = () => override ?? ENV_API_URL

export const hasApiUrlOverride = () => override !== null

/** Lê o endereço salvo. Chamar antes da primeira requisição (feito no App). */
export async function loadApiUrl(): Promise<void> {
  try {
    override = await AsyncStorage.getItem(STORAGE_KEY)
  } catch {
    override = null
  }
}

/** Normaliza o que o usuário digitou: adiciona http:// se faltar e remove a barra final. Null se inválido. */
export function normalizeApiUrl(input: string): string | null {
  let url = input.trim()
  if (!url) return null
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`
  url = url.replace(/\/+$/, '')
  return /^https?:\/\/[^\s/]+/i.test(url) ? url : null
}

/** Salva um endereço (null volta para o do .env). */
export async function setApiUrl(url: string | null): Promise<void> {
  override = url && url !== ENV_API_URL ? url : null
  if (override) await AsyncStorage.setItem(STORAGE_KEY, override)
  else await AsyncStorage.removeItem(STORAGE_KEY)
}

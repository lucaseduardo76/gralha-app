import * as SecureStore from 'expo-secure-store'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '../types/auth'

const ACCESS_KEY = 'gralhafit_access_token'
const REFRESH_KEY = 'gralhafit_refresh_token'

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_KEY)
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY)

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([SecureStore.setItemAsync(ACCESS_KEY, accessToken), SecureStore.setItemAsync(REFRESH_KEY, refreshToken)])
}

export async function clearTokens(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)])
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

/** Considera expirado 30 s antes, para não mandar um token que vence no caminho. */
export function isTokenExpired(token: string): boolean {
  const exp = decodeToken(token)?.exp
  return !exp || exp * 1000 - 30_000 < Date.now()
}

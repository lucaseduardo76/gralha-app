import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { getPerfil } from '../api/usuarios'
import { onSessionExpired, refreshAccessToken } from '../lib/api'
import { clearTokens, decodeToken, getAccessToken, getRefreshToken, saveTokens } from '../lib/token'
import type { AuthResponse, Role } from '../types/auth'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: Role
}

interface AuthContextValue {
  usuario: Usuario | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  register: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  /** Sessão encerrada sem chamar o servidor (ex.: depois de excluir a conta). */
  encerrarSessaoLocal: () => Promise<void>
  atualizarNome: (nome: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** E-mail e role vêm das claims do access token; o nome, do perfil. */
function usuarioDoToken(token: string, nome: string): Usuario | null {
  const claims = decodeToken(token)
  if (!claims?.sub) return null
  return { id: claims.sub, email: claims.email ?? '', role: claims.role ?? 'USUARIO', nome }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const encerrarSessaoLocal = useCallback(async () => {
    await clearTokens()
    queryClient.clear()
    setUsuario(null)
  }, [queryClient])

  // Restaura a sessão ao abrir o app: GET /usuarios/me valida o token (o interceptor renova se preciso).
  useEffect(() => {
    ;(async () => {
      try {
        if (!(await getAccessToken()) && !(await getRefreshToken())) return
        const perfil = await getPerfil()
        const token = (await getAccessToken()) ?? (await refreshAccessToken())
        setUsuario(token ? usuarioDoToken(token, perfil.nome) : null)
      } catch {
        await clearTokens()
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => onSessionExpired(() => void encerrarSessaoLocal()), [encerrarSessaoLocal])

  const entrar = async (resposta: AuthResponse) => {
    await saveTokens(resposta.access_token, resposta.refresh_token)
    setUsuario(usuarioDoToken(resposta.access_token, resposta.usuario.nome))
  }

  const logout = async () => {
    const refreshToken = await getRefreshToken()
    // Best-effort: sem rede, a sessão local é encerrada mesmo assim.
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined)
    await encerrarSessaoLocal()
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAdmin: usuario?.role === 'ADMIN',
        isLoading,
        login: async (email, senha) => entrar(await authApi.login(email, senha)),
        register: async (nome, email, senha) => entrar(await authApi.register(nome, email, senha)),
        logout,
        encerrarSessaoLocal,
        atualizarNome: (nome) => setUsuario((u) => (u ? { ...u, nome } : u)),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

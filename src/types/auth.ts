export type Role = 'USUARIO' | 'ADMIN'

export interface UsuarioResumo {
  id: string
  email: string
  nome: string
}

/** POST /authentication/{register,login,google,refresh} — contrato em gralha-back/memoria/planos/plano-auth-propria.md. */
export interface AuthResponse {
  token_type: 'Bearer'
  access_token: string
  expires_at: string
  refresh_token: string
  usuario: UsuarioResumo
}

export interface JwtPayload {
  sub: string
  email?: string
  role?: Role
  exp?: number
}

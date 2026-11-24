import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Linking, Platform } from 'react-native'
import { getAppVersion } from '../api/usuarios'
import { APP_VERSION, compararVersao } from '../lib/versao'
import { Button, EmptyState, Screen } from './ui'

/**
 * Bloqueia o app quando a versão instalada é menor que a mínima do backend (GET /app/version). Falha de rede não
 * bloqueia: o app segue e checa de novo na próxima abertura.
 */
export function AtualizacaoObrigatoria({ children }: { children: ReactNode }) {
  const versao = useQuery({ queryKey: ['app-version'], queryFn: getAppVersion, staleTime: 60 * 60_000, retry: false })
  const minima = versao.data?.min_version
  if (!minima || compararVersao(APP_VERSION, minima) >= 0) return <>{children}</>

  const loja = Platform.OS === 'ios' ? versao.data?.store_url_ios : versao.data?.store_url_android
  return (
    <Screen>
      <EmptyState
        icon={Download}
        title="Atualize o GralhaFit"
        message={`Esta versão (${APP_VERSION}) não é mais suportada. Instale a versão ${versao.data?.latest_version ?? minima} ou mais nova para continuar.`}
        action={loja ? <Button title="Atualizar agora" onPress={() => Linking.openURL(loja)} /> : undefined}
      />
    </Screen>
  )
}

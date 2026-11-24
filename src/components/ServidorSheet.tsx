import axios from 'axios'
import { Server } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ENV_API_URL, getApiUrl, hasApiUrlOverride, normalizeApiUrl, setApiUrl } from '../lib/env'
import { Button, TextField } from './ui'
import { BottomSheet } from './ui/BottomSheet'

type Status = { tipo: 'ok' | 'erro'; texto: string } | null

/** Folha para trocar o endereço da API sem rebuildar (ex.: túnel que muda a cada apresentação). */
export function ServidorSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [url, setUrl] = useState(getApiUrl())
  const [status, setStatus] = useState<Status>(null)
  const [testando, setTestando] = useState(false)

  useEffect(() => {
    if (!visible) return
    setUrl(getApiUrl())
    setStatus(null)
  }, [visible])

  const testar = async () => {
    const alvo = normalizeApiUrl(url)
    if (!alvo) return setStatus({ tipo: 'erro', texto: 'Endereço inválido.' })
    setTestando(true)
    setStatus(null)
    try {
      // Qualquer resposta HTTP (até 401/404) prova que o servidor está de pé; só falha de rede conta como erro.
      await axios.get(alvo, { timeout: 8_000, validateStatus: () => true })
      setStatus({ tipo: 'ok', texto: 'Servidor respondeu.' })
    } catch {
      setStatus({ tipo: 'erro', texto: 'Não foi possível conectar nesse endereço.' })
    } finally {
      setTestando(false)
    }
  }

  const salvar = async () => {
    const alvo = normalizeApiUrl(url)
    if (!alvo) return setStatus({ tipo: 'erro', texto: 'Endereço inválido.' })
    await setApiUrl(alvo)
    onClose()
  }

  const restaurar = async () => {
    await setApiUrl(null)
    setUrl(ENV_API_URL)
    setStatus({ tipo: 'ok', texto: 'Voltou para o endereço padrão.' })
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Servidor">
      <View className="gap-4">
        <TextField
          icon={Server}
          placeholder="https://meu-servidor.com"
          value={url}
          onChangeText={(t) => {
            setUrl(t)
            setStatus(null)
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onSubmitEditing={salvar}
        />
        <Text className="font-medium text-xs text-muted dark:text-muted-dark">Padrão do build: {ENV_API_URL}</Text>
        {status && <Text className={`font-semibold text-sm ${status.tipo === 'ok' ? 'text-primary' : 'text-danger'}`}>{status.texto}</Text>}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Testar" variant="secondary" onPress={testar} loading={testando} />
          </View>
          <View className="flex-1">
            <Button title="Salvar" onPress={salvar} />
          </View>
        </View>
        {hasApiUrlOverride() && (
          <Pressable onPress={restaurar} className="items-center py-1" hitSlop={8}>
            <Text className="font-bold text-sm text-muted dark:text-muted-dark">Usar endereço padrão</Text>
          </Pressable>
        )}
      </View>
    </BottomSheet>
  )
}

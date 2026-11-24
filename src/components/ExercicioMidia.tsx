import { Image } from 'expo-image'
import { Dumbbell } from 'lucide-react-native'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { colors } from '../lib/theme'

/**
 * Mídia dos exercícios. O catálogo (ExerciseGymGifsDB) traz um GIF 360x360 em video_url_* e uma miniatura
 * 128x128 em thumbnail_url_* (mesmo caminho: "x.gif" / "x.thumb.webp"). Listas usam a miniatura e só
 * o detalhe e a sessão usam o GIF: mesmo parado (autoplay=false), o expo-image baixa e mantém o GIF inteiro no heap
 * Java, e rolar o catálogo estourava a memória no Android (OutOfMemoryError).
 */
type ComMidia = {
  video_url_male?: string | null
  video_url_female?: string | null
  thumbnail_url_male?: string | null
  thumbnail_url_female?: string | null
}

const MINIATURA_DO_CATALOGO = /\.thumb\.webp(\?.*)?$/i

/** URL do GIF a partir de uma miniatura do catálogo (usado onde a API só manda thumbnail_url, ex.: sessão). */
export function gifDaMiniatura(url: string | null | undefined): string | null {
  if (!url) return null
  return MINIATURA_DO_CATALOGO.test(url) ? url.replace(MINIATURA_DO_CATALOGO, '.gif$1') : url
}

const ehImagem = (url: string) => /\.(gif|webp|png|jpe?g)(\?.*)?$/i.test(url)

/** Melhor imagem do exercício: o GIF (vídeo do catálogo) se for imagem; senão a miniatura. */
export function midiaExercicio(e: ComMidia): string | null {
  const video = e.video_url_female ?? e.video_url_male
  if (video && ehImagem(video)) return video
  return gifDaMiniatura(e.thumbnail_url_female ?? e.thumbnail_url_male)
}

/** Imagem leve para listas: a miniatura; sem ela, o GIF. */
export function miniaturaExercicio(e: ComMidia): string | null {
  return e.thumbnail_url_female ?? e.thumbnail_url_male ?? midiaExercicio(e)
}

/** Vídeo externo (YouTube etc.) cadastrado pelo admin — esse sim abre fora do app. */
export function videoExterno(e: ComMidia): string | null {
  const video = e.video_url_female ?? e.video_url_male
  return video && !ehImagem(video) ? video : null
}

export function ExercicioMidia({
  uri,
  animar = false,
  tamanho,
  raio = 16,
  style,
  iconeSize = 26,
}: {
  uri: string | null | undefined
  /** true: GIF em loop; false: parado (listas, com miniaturaExercicio). */
  animar?: boolean
  /** Quadrado de lado fixo; sem ele, ocupa a largura disponível (quadrado). */
  tamanho?: number
  raio?: number
  style?: StyleProp<ViewStyle>
  iconeSize?: number
}) {
  const caixa: StyleProp<ViewStyle> = [
    tamanho ? { width: tamanho, height: tamanho } : { width: '100%', aspectRatio: 1 },
    { borderRadius: raio, overflow: 'hidden' },
    style,
  ]
  if (!uri) {
    return (
      <View style={[caixa, { alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}26` }]}>
        <Dumbbell size={iconeSize} color={colors.primary} />
      </View>
    )
  }
  // Os GIFs do catálogo têm fundo branco: o fundo branco + "contain" mostra o movimento inteiro, sem cortar.
  return (
    <View style={[caixa, { backgroundColor: '#fff' }]}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        autoplay={animar}
        cachePolicy="disk"
        recyclingKey={uri}
        transition={150}
        accessibilityIgnoresInvertColors
      />
    </View>
  )
}

import { useState } from 'react'
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { useTheme } from '../context/ThemeContext'
import { colors } from '../lib/theme'

export interface PontoGrafico {
  rotulo: string // eixo x (data curta)
  valor: number | null
}

const ALTURA = 200
const MARGEM = { topo: 28, base: 26, esquerda: 40, direita: 12 }

function escala(valores: number[]) {
  const max = Math.max(...valores, 0)
  const min = Math.min(...valores, max)
  const passo = (max - min || max || 1) * 0.15
  const topo = max + passo
  const base = Math.max(0, min - passo)
  return { base, topo }
}

function formatar(v: number, unidade: string) {
  const n = v >= 100 ? Math.round(v).toLocaleString('pt-BR') : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return unidade ? `${n} ${unidade}` : n
}

/**
 * Gráfico de uma série só (linha ou barras), cor primária, grade recessiva e toque para ver o valor. Sem pontos: eixos
 * vazios com a mensagem (regra 9).
 */
export function Grafico({ pontos, tipo, unidade, vazio }: { pontos: PontoGrafico[]; tipo: 'linha' | 'barras'; unidade: string; vazio: string }) {
  const { palette } = useTheme()
  const [largura, setLargura] = useState(0)
  const [ativo, setAtivo] = useState<number | null>(null)
  const validos = pontos.filter((p) => p.valor != null) as { rotulo: string; valor: number }[]
  const aoMedir = (e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)

  const areaL = Math.max(0, largura - MARGEM.esquerda - MARGEM.direita)
  const areaA = ALTURA - MARGEM.topo - MARGEM.base
  const { base, topo } = escala(validos.map((p) => p.valor))
  const y = (v: number) => MARGEM.topo + areaA - ((v - base) / (topo - base || 1)) * areaA
  const n = validos.length
  const passoX = n > 1 ? areaL / (n - 1) : 0
  const x = (i: number) => (tipo === 'barras' ? MARGEM.esquerda + (areaL / n) * (i + 0.5) : MARGEM.esquerda + (n > 1 ? passoX * i : areaL / 2))
  const linhasGrade = [0, 0.5, 1].map((f) => base + (topo - base) * f)
  const rotulosX = n <= 6 ? validos.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1]
  const larguraBarra = n ? Math.min(28, (areaL / n) * 0.6) : 0

  return (
    <View onLayout={aoMedir} style={{ height: ALTURA }}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA}>
          {linhasGrade.map((v, i) => (
            <Line key={i} x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} stroke={palette.edge} strokeWidth={1} />
          ))}
          {n > 0 &&
            linhasGrade.map((v, i) => (
              <SvgText key={`r${i}`} x={MARGEM.esquerda - 6} y={y(v) + 4} fontSize={10} fill={palette.muted} textAnchor="end">
                {formatar(v, '')}
              </SvgText>
            ))}
          {tipo === 'linha' && n > 1 && (
            <Path d={validos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valor)}`).join(' ')} stroke={colors.primary} strokeWidth={2} fill="none" />
          )}
          {validos.map((p, i) =>
            tipo === 'barras' ? (
              <Rect
                key={i}
                x={x(i) - larguraBarra / 2}
                y={y(p.valor)}
                width={larguraBarra}
                height={Math.max(2, MARGEM.topo + areaA - y(p.valor))}
                rx={4}
                fill={colors.primary}
                opacity={ativo == null || ativo === i ? 1 : 0.45}
              />
            ) : (
              <Circle key={i} cx={x(i)} cy={y(p.valor)} r={ativo === i ? 6 : 4} fill={colors.primary} stroke={palette.surface} strokeWidth={2} />
            ),
          )}
          {rotulosX.map((i) =>
            validos[i] ? (
              <SvgText key={`x${i}`} x={x(i)} y={ALTURA - 8} fontSize={10} fill={palette.muted} textAnchor="middle">
                {validos[i].rotulo}
              </SvgText>
            ) : null,
          )}
          {ativo != null && validos[ativo] && (
            <SvgText x={Math.min(Math.max(x(ativo), 50), largura - 50)} y={Math.max(14, y(validos[ativo].valor) - 12)} fontSize={12} fontWeight="bold" fill={palette.ink} textAnchor="middle">
              {`${formatar(validos[ativo].valor, unidade)} · ${validos[ativo].rotulo}`}
            </SvgText>
          )}
        </Svg>
      )}
      {/* Alvos de toque maiores que as marcas: uma faixa vertical por ponto. */}
      {largura > 0 && n > 0 && (
        <View style={{ position: 'absolute', left: MARGEM.esquerda, top: 0, width: areaL, height: ALTURA, flexDirection: 'row' }}>
          {validos.map((_, i) => (
            <Pressable key={i} style={{ flex: 1 }} onPress={() => setAtivo(ativo === i ? null : i)} accessibilityLabel={`${validos[i].rotulo}: ${formatar(validos[i].valor, unidade)}`} />
          ))}
        </View>
      )}
      {n === 0 && (
        <View style={{ position: 'absolute', left: MARGEM.esquerda, right: MARGEM.direita, top: MARGEM.topo, bottom: MARGEM.base }} className="items-center justify-center">
          <Text className="text-center font-semibold text-sm text-muted dark:text-muted-dark">{vazio}</Text>
        </View>
      )}
    </View>
  )
}

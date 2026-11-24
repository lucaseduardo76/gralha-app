import type { Modalidade, Prescricao } from '../types/domain'

export function saudacao(agora = new Date()): string {
  const h = agora.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function primeiroNome(nome: string | undefined | null): string {
  return (nome ?? '').trim().split(/\s+/)[0] ?? ''
}

export function iniciais(nome: string | undefined | null): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?'
}

export const MODALIDADE_LABEL: Record<Modalidade, string> = {
  musculacao: 'Musculação',
  funcional_calistenia: 'Funcional',
  corrida_cardio: 'Cardio',
  mobilidade: 'Mobilidade',
}

/** "4 × 10" · "4 × 10 · 60 s" · "5 km" · "30 s" — conforme o que a prescrição tem. */
export function resumoPrescricao(p: Prescricao): string {
  const partes: string[] = []
  if (p.series_alvo && p.repeticoes_alvo) partes.push(`${p.series_alvo} × ${p.repeticoes_alvo}`)
  else if (p.series_alvo) partes.push(`${p.series_alvo} séries`)
  if (p.distancia_alvo_km) partes.push(`${p.distancia_alvo_km} km`)
  if (p.duracao_alvo_seg) partes.push(duracao(p.duracao_alvo_seg))
  if (p.descanso_alvo_seg) partes.push(`descanso ${p.descanso_alvo_seg} s`)
  return partes.join(' · ') || 'Livre'
}

export function duracao(seg: number): string {
  if (seg < 60) return `${seg} s`
  const min = Math.floor(seg / 60)
  const resto = seg % 60
  return resto ? `${min} min ${resto} s` : `${min} min`
}

export function dataCurta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/** "1995-04-20" ⇄ "20/04/1995" */
export const isoParaBr = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '')

export function brParaIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

/** Dias ISO (1 = segunda … 7 = domingo). */
export const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7] as const
export const DIA_SEMANA_CURTO: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' }
export const DIA_SEMANA_LONGO: Record<number, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
  7: 'Domingo',
}

/** "Seg · Qua · Sex" ou "Sem dia fixo". */
export function diasSemanaTexto(dias: number[]): string {
  if (!dias.length) return 'Sem dia fixo'
  if (dias.length === 7) return 'Todos os dias'
  return [...dias].sort((a, b) => a - b).map((d) => DIA_SEMANA_CURTO[d]).join(' · ')
}

/** Dia ISO de hoje (1 = segunda … 7 = domingo). */
export function diaSemanaHoje(agora = new Date()): number {
  return agora.getDay() === 0 ? 7 : agora.getDay()
}

/** "4 × 10 · 40 kg · descanso 90 s" a partir de alvos soltos. */
export function resumoAlvos(a: {
  series_alvo: number | null
  repeticoes_alvo: number | null
  carga_alvo_kg?: number | null
  descanso_alvo_seg: number | null
  distancia_alvo_km?: number | null
  duracao_alvo_seg?: number | null
}): string {
  const partes: string[] = []
  if (a.series_alvo && a.repeticoes_alvo) partes.push(`${a.series_alvo} × ${a.repeticoes_alvo}`)
  else if (a.series_alvo) partes.push(`${a.series_alvo} séries`)
  if (a.carga_alvo_kg) partes.push(`${kg(a.carga_alvo_kg)} kg`)
  if (a.distancia_alvo_km) partes.push(`${a.distancia_alvo_km} km`)
  if (a.duracao_alvo_seg) partes.push(duracao(a.duracao_alvo_seg))
  if (a.descanso_alvo_seg) partes.push(`descanso ${a.descanso_alvo_seg} s`)
  return partes.join(' · ') || 'Livre'
}

/** 40 → "40", 42.5 → "42,5". */
export function kg(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** "42,5" / "42.5" → 42.5; vazio/inválido → null. */
export function parseNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// Versão do app (app.json). Comparada com GET /app/version para atualização obrigatória.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const APP_VERSION: string = require('../../app.json').expo.version

/** -1, 0 ou 1 comparando "1.2.10" com "1.2.9" por partes numéricas. */
export function compararVersao(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d > 0 ? 1 : -1
  }
  return 0
}

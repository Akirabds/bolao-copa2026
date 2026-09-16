// Atualiza datas/horários reais da Fase 2 (mata-mata) — Copa 2026
// Os nomes das seleções serão preenchidos depois, quando os classificados forem definidos
// Fonte: Wikipedia / schedule oficial Copa 2026

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// ── OITAVAS DE FINAL (16 jogos) — 28/06 a 03/07 ─────────────────────────
const ROUND_OF_32 = [
  '2026-06-28T20:00:00Z', // 28/06 17:00 BRT
  '2026-06-29T16:00:00Z', // 29/06 13:00 BRT
  '2026-06-29T20:30:00Z', // 29/06 17:30 BRT
  '2026-06-30T00:00:00Z', // 29/06 21:00 BRT
  '2026-06-30T16:00:00Z', // 30/06 13:00 BRT
  '2026-06-30T21:00:00Z', // 30/06 18:00 BRT
  '2026-07-01T00:00:00Z', // 30/06 21:00 BRT
  '2026-07-01T16:00:00Z', // 01/07 13:00 BRT
  '2026-07-01T20:00:00Z', // 01/07 17:00 BRT
  '2026-07-02T00:00:00Z', // 01/07 21:00 BRT
  '2026-07-02T19:00:00Z', // 02/07 16:00 BRT
  '2026-07-02T23:00:00Z', // 02/07 20:00 BRT
  '2026-07-03T03:00:00Z', // 03/07 00:00 BRT
  '2026-07-03T17:00:00Z', // 03/07 14:00 BRT
  '2026-07-03T22:00:00Z', // 03/07 19:00 BRT
  '2026-07-04T00:30:00Z', // 03/07 21:30 BRT
]

// ── QUARTAS-DE-FINAL / 16 AVOS (8 jogos) — 04/07 a 07/07 ────────────────
const ROUND_OF_16 = [
  '2026-07-04T16:00:00Z', // 04/07 13:00 BRT
  '2026-07-04T21:00:00Z', // 04/07 18:00 BRT
  '2026-07-05T20:00:00Z', // 05/07 17:00 BRT
  '2026-07-05T23:00:00Z', // 05/07 20:00 BRT
  '2026-07-06T18:00:00Z', // 06/07 15:00 BRT
  '2026-07-07T00:00:00Z', // 06/07 21:00 BRT
  '2026-07-07T16:00:00Z', // 07/07 13:00 BRT
  '2026-07-07T20:00:00Z', // 07/07 17:00 BRT
]

// ── QUARTAS DE FINAL (4 jogos) — 09/07 a 11/07 ───────────────────────────
const QUARTERS = [
  '2026-07-09T20:00:00Z', // 09/07 17:00 BRT
  '2026-07-10T19:00:00Z', // 10/07 16:00 BRT
  '2026-07-11T21:00:00Z', // 11/07 18:00 BRT
  '2026-07-12T00:00:00Z', // 11/07 21:00 BRT
]

// ── SEMIFINAIS (2 jogos) — 14/07 e 15/07 ────────────────────────────────
const SEMIS = [
  '2026-07-14T18:00:00Z', // 14/07 15:00 BRT
  '2026-07-15T19:00:00Z', // 15/07 16:00 BRT
]

// Busca os 30 jogos da fase2 ordenados por (kickoffAt, sortOrder)
const fase2 = await p.phase.findUnique({ where: { slug: 'fase2' } })
if (!fase2) { console.error('Fase 2 não encontrada'); process.exit(1) }

const matches = await p.match.findMany({
  where: { phaseId: fase2.id },
  orderBy: [{ kickoffAt: 'asc' }, { sortOrder: 'asc' }],
})

const r32 = matches.slice(0, 16)
const r16 = matches.slice(16, 24)
const qf  = matches.slice(24, 28)
const sf  = matches.slice(28, 30)

async function updateGroup(label, groupMatches, times) {
  console.log(`\n── ${label} (${groupMatches.length} jogos) ──`)
  for (let i = 0; i < groupMatches.length; i++) {
    const kickoffAt = new Date(times[i])
    const predictionDeadlineAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000)
    await p.match.update({
      where: { id: groupMatches[i].id },
      data: { kickoffAt, predictionDeadlineAt },
    })
    const brt = new Date(kickoffAt.getTime() - 3 * 3600000)
    console.log(`  ✓ Jogo ${i + 1} → ${brt.toISOString().replace('T',' ').slice(0,16)} BRT`)
  }
}

await updateGroup('Oitavas de Final', r32, ROUND_OF_32)
await updateGroup('16-avos (Round of 16)', r16, ROUND_OF_16)
await updateGroup('Quartas de Final', qf, QUARTERS)
await updateGroup('Semifinais', sf, SEMIS)

console.log(`\n30 jogos da Fase 2 atualizados.`)
await p.$disconnect()

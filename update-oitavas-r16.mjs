// Atualiza os 8 jogos das Oitavas de Final (Round of 16) — times reais e horários corretos
// Fonte: GE Globo — Copa 2026 | Hoje = 05/07/2026
// NÃO altera officialScore nem matchStatus (preserva resultados já lançados)

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Ordenados por kickoff UTC crescente (BRT = UTC - 3h)
const OITAVAS_R16 = [
  { kickoff: '2026-07-04T17:00:00Z', s1: 'Canadá',        f1: '🇨🇦', s2: 'Marrocos',     f2: '🇲🇦' }, // 04/07 14:00 BRT
  { kickoff: '2026-07-04T21:00:00Z', s1: 'Paraguai',      f1: '🇵🇾', s2: 'França',       f2: '🇫🇷' }, // 04/07 18:00 BRT
  { kickoff: '2026-07-05T20:00:00Z', s1: 'Brasil',        f1: '🇧🇷', s2: 'Noruega',      f2: '🇳🇴' }, // 05/07 17:00 BRT
  { kickoff: '2026-07-06T00:00:00Z', s1: 'México',        f1: '🇲🇽', s2: 'Inglaterra',   f2: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, // 05/07 21:00 BRT ⚠️ urgente
  { kickoff: '2026-07-06T19:00:00Z', s1: 'Portugal',      f1: '🇵🇹', s2: 'Espanha',      f2: '🇪🇸' }, // 06/07 16:00 BRT
  { kickoff: '2026-07-07T00:00:00Z', s1: 'Estados Unidos',f1: '🇺🇸', s2: 'Bélgica',      f2: '🇧🇪' }, // 06/07 21:00 BRT
  { kickoff: '2026-07-07T16:00:00Z', s1: 'Argentina',     f1: '🇦🇷', s2: 'Egito',        f2: '🇪🇬' }, // 07/07 13:00 BRT
  { kickoff: '2026-07-07T20:00:00Z', s1: 'Suíça',         f1: '🇨🇭', s2: 'Colômbia',     f2: '🇨🇴' }, // 07/07 17:00 BRT
]

const fase2 = await p.phase.findUnique({ where: { slug: 'fase2' } })
if (!fase2) { console.error('Fase 2 não encontrada'); process.exit(1) }

const allMatches = await p.match.findMany({
  where: { phaseId: fase2.id },
  orderBy: [{ kickoffAt: 'asc' }, { sortOrder: 'asc' }],
})

// Posições 16-23 são as oitavas (round of 16)
const r16Matches = allMatches.slice(16, 24)

if (r16Matches.length !== 8) {
  console.error(`Esperava 8 jogos nas oitavas, encontrou ${r16Matches.length}`)
  process.exit(1)
}

console.log('\n── Oitavas de Final (Round of 16) — atualizando times e horários ──')

for (let i = 0; i < 8; i++) {
  const match = r16Matches[i]
  const data = OITAVAS_R16[i]
  const kickoffAt = new Date(data.kickoff)
  const predictionDeadlineAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000)

  await p.match.update({
    where: { id: match.id },
    data: {
      selection1: data.s1,
      flag1: data.f1,
      selection2: data.s2,
      flag2: data.f2,
      kickoffAt,
      predictionDeadlineAt,
    },
  })

  const brt = new Date(kickoffAt.getTime() - 3 * 3600000)
  const brtStr = brt.toISOString().replace('T', ' ').slice(0, 16)
  const hasResult = match.officialScore1 !== null
  const resultTag = hasResult ? ` [resultado: ${match.officialScore1}x${match.officialScore2} mantido]` : ''
  console.log(`  ✓ [${i + 1}] ${data.s1} x ${data.s2} → ${brtStr} BRT${resultTag}`)
}

console.log('\n8 jogos das oitavas (round of 16) atualizados.')
await p.$disconnect()

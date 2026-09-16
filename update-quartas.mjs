// Atualiza os 4 jogos das Quartas de Final — times reais e horários corretos
// Fonte: GE Globo — Copa 2026 | Hoje = 08/07/2026

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Ordenados por kickoff UTC crescente (BRT = UTC - 3h)
const QUARTAS = [
  { kickoff: '2026-07-09T20:00:00Z', s1: 'França',    f1: '🇫🇷', s2: 'Marrocos',   f2: '🇲🇦' }, // 09/07 17:00 BRT
  { kickoff: '2026-07-10T19:00:00Z', s1: 'Espanha',   f1: '🇪🇸', s2: 'Bélgica',    f2: '🇧🇪' }, // 10/07 16:00 BRT
  { kickoff: '2026-07-11T21:00:00Z', s1: 'Noruega',   f1: '🇳🇴', s2: 'Inglaterra', f2: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, // 11/07 18:00 BRT
  { kickoff: '2026-07-12T01:00:00Z', s1: 'Argentina', f1: '🇦🇷', s2: 'Suíça',      f2: '🇨🇭' }, // 11/07 22:00 BRT ⚠️ corrigido
]

const fase2 = await p.phase.findUnique({ where: { slug: 'fase2' } })
if (!fase2) { console.error('Fase 2 não encontrada'); process.exit(1) }

const allMatches = await p.match.findMany({
  where: { phaseId: fase2.id },
  orderBy: [{ kickoffAt: 'asc' }, { sortOrder: 'asc' }],
})

// Posições 24-27 são as quartas de final
const quartasMatches = allMatches.slice(24, 28)

if (quartasMatches.length !== 4) {
  console.error(`Esperava 4 jogos nas quartas, encontrou ${quartasMatches.length}`)
  process.exit(1)
}

console.log('\n── Quartas de Final — atualizando times e horários ──')

for (let i = 0; i < 4; i++) {
  const match = quartasMatches[i]
  const data = QUARTAS[i]
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

console.log('\n4 jogos das quartas de final atualizados.')
await p.$disconnect()

// Atualiza os 16 jogos das Oitavas de Final (Fase 2) com times reais e horários corretos
// Fonte: GE Globo / Wikipedia — Copa 2026
// Rodada em ordem cronológica (UTC)

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Dados completos das oitavas — ordenados por kickoff UTC crescente
// BRT = UTC - 3h
const OITAVAS = [
  { kickoff: '2026-06-28T19:00:00Z', s1: 'África do Sul', f1: '🇿🇦', s2: 'Canadá',       f2: '🇨🇦' }, // 28/06 16:00 BRT
  { kickoff: '2026-06-29T17:00:00Z', s1: 'Brasil',        f1: '🇧🇷', s2: 'Japão',        f2: '🇯🇵' }, // 29/06 14:00 BRT
  { kickoff: '2026-06-29T20:30:00Z', s1: 'Alemanha',      f1: '🇩🇪', s2: 'Paraguai',     f2: '🇵🇾' }, // 29/06 17:30 BRT
  { kickoff: '2026-06-30T01:00:00Z', s1: 'Holanda',       f1: '🇳🇱', s2: 'Marrocos',     f2: '🇲🇦' }, // 29/06 22:00 BRT
  { kickoff: '2026-06-30T17:00:00Z', s1: 'Costa do Marfim',f1:'🇨🇮', s2: 'Noruega',      f2: '🇳🇴' }, // 30/06 14:00 BRT
  { kickoff: '2026-06-30T21:00:00Z', s1: 'França',        f1: '🇫🇷', s2: 'Suécia',       f2: '🇸🇪' }, // 30/06 18:00 BRT
  { kickoff: '2026-07-01T01:00:00Z', s1: 'México',        f1: '🇲🇽', s2: 'Equador',      f2: '🇪🇨' }, // 30/06 22:00 BRT
  { kickoff: '2026-07-01T16:00:00Z', s1: 'Inglaterra',    f1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', s2: 'RD Congo',    f2: '🇨🇩' }, // 01/07 13:00 BRT
  { kickoff: '2026-07-01T20:00:00Z', s1: 'Bélgica',       f1: '🇧🇪', s2: 'Senegal',      f2: '🇸🇳' }, // 01/07 17:00 BRT
  { kickoff: '2026-07-02T00:00:00Z', s1: 'Estados Unidos',f1: '🇺🇸', s2: 'Bósnia',       f2: '🇧🇦' }, // 01/07 21:00 BRT
  { kickoff: '2026-07-02T19:00:00Z', s1: 'Espanha',       f1: '🇪🇸', s2: 'Áustria',      f2: '🇦🇹' }, // 02/07 16:00 BRT
  { kickoff: '2026-07-02T23:00:00Z', s1: 'Portugal',      f1: '🇵🇹', s2: 'Croácia',      f2: '🇭🇷' }, // 02/07 20:00 BRT
  { kickoff: '2026-07-03T03:00:00Z', s1: 'Suíça',         f1: '🇨🇭', s2: 'Argélia',      f2: '🇩🇿' }, // 03/07 00:00 BRT
  { kickoff: '2026-07-03T18:00:00Z', s1: 'Austrália',     f1: '🇦🇺', s2: 'Egito',        f2: '🇪🇬' }, // 03/07 15:00 BRT
  { kickoff: '2026-07-03T22:00:00Z', s1: 'Argentina',     f1: '🇦🇷', s2: 'Cabo Verde',   f2: '🇨🇻' }, // 03/07 19:00 BRT
  { kickoff: '2026-07-04T01:30:00Z', s1: 'Colômbia',      f1: '🇨🇴', s2: 'Gana',         f2: '🇬🇭' }, // 03/07 22:30 BRT
]

const fase2 = await p.phase.findUnique({ where: { slug: 'fase2' } })
if (!fase2) { console.error('Fase 2 não encontrada'); process.exit(1) }

// Busca os 30 jogos da fase2 ordenados cronologicamente
const allMatches = await p.match.findMany({
  where: { phaseId: fase2.id },
  orderBy: [{ kickoffAt: 'asc' }, { sortOrder: 'asc' }],
})

// Os primeiros 16 são as oitavas
const oitavasMatches = allMatches.slice(0, 16)

if (oitavasMatches.length !== 16) {
  console.error(`Esperava 16 jogos nas oitavas, encontrou ${oitavasMatches.length}`)
  process.exit(1)
}

console.log('\n── Oitavas de Final — atualizando times e horários ──')

for (let i = 0; i < 16; i++) {
  const match = oitavasMatches[i]
  const data = OITAVAS[i]
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
  console.log(`  ✓ [${i + 1}] ${data.s1} x ${data.s2} → ${brtStr} BRT`)
}

console.log('\n16 jogos das oitavas atualizados com sucesso.')
await p.$disconnect()

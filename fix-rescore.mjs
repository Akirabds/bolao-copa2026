// Re-pontua todos os palpites SCORED com as regras atuais do banco
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

function getOutcome(s1, s2) {
  if (s1 > s2) return 'TEAM1'
  if (s2 > s1) return 'TEAM2'
  return 'DRAW'
}

function calculateScore(official1, official2, predicted1, predicted2, pts) {
  const exact = official1 === predicted1 && official2 === predicted2
  const outcomeHit = getOutcome(official1, official2) === getOutcome(predicted1, predicted2)

  if (exact) return { points: pts.EXACT, ruleKey: 'EXACT', exactScoreHit: true, outcomeHit: true, detail: `Placar exato ${official1}x${official2} (+${pts.EXACT} pts)` }
  if (outcomeHit) return { points: pts.WINNER, ruleKey: 'WINNER', exactScoreHit: false, outcomeHit: true, detail: `Vencedor/empate correto (+${pts.WINNER} pts)` }
  return { points: pts.MISS, ruleKey: 'MISS', exactScoreHit: false, outcomeHit: false, detail: 'Palpite incorreto (0 pts)' }
}

// Lê regras do banco
const rawRules = await p.scoreRule.findMany({ where: { isActive: true } })
const pts = Object.fromEntries(rawRules.map(r => [r.ruleKey, r.points]))
console.log('Regras:', pts)

// Busca todos os palpites SCORED com a partida correspondente
const predictions = await p.prediction.findMany({
  where: { status: 'SCORED' },
  include: { match: true },
})

console.log(`\n${predictions.length} palpites para re-pontuar...`)

let updated = 0
let unchanged = 0

for (const pred of predictions) {
  const match = pred.match
  if (match.officialScore1 === null || match.officialScore2 === null) continue

  const scored = calculateScore(
    match.officialScore1,
    match.officialScore2,
    pred.predictedScore1,
    pred.predictedScore2,
    pts
  )

  if (scored.points === pred.pointsAwarded) {
    unchanged++
    continue
  }

  await p.prediction.update({
    where: { id: pred.id },
    data: {
      pointsAwarded: scored.points,
      exactScoreHit: scored.exactScoreHit,
      outcomeHit: scored.outcomeHit,
      scoringDetail: scored.detail,
    },
  })
  console.log(`  ↑ ${match.selection1}×${match.selection2} | palpite ${pred.predictedScore1}×${pred.predictedScore2} | ${pred.pointsAwarded}→${scored.points} pts`)
  updated++
}

console.log(`\n${updated} atualizados, ${unchanged} sem mudança.`)

// Recalcula rankings para todas as fases afetadas
if (updated > 0) {
  const phaseIds = [...new Set(predictions.map(p => p.phaseId))]
  for (const phaseId of phaseIds) {
    const entries = await p.prediction.groupBy({
      by: ['userId'],
      where: { phaseId, status: 'SCORED' },
      _sum: { pointsAwarded: true },
    })
    const exactCounts = await p.prediction.groupBy({
      by: ['userId'],
      where: { phaseId, status: 'SCORED', exactScoreHit: true },
      _count: { id: true },
    })
    const outcomeCounts = await p.prediction.groupBy({
      by: ['userId'],
      where: { phaseId, status: 'SCORED', outcomeHit: true },
      _count: { id: true },
    })
    const exactMap = new Map(exactCounts.map(e => [e.userId, e._count.id]))
    const outcomeMap = new Map(outcomeCounts.map(e => [e.userId, e._count.id]))

    const sorted = entries
      .map(e => ({ userId: e.userId, totalPoints: e._sum.pointsAwarded ?? 0, exactScores: exactMap.get(e.userId) ?? 0, outcomeHits: outcomeMap.get(e.userId) ?? 0 }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores || b.outcomeHits - a.outcomeHits)

    for (let i = 0; i < sorted.length; i++) {
      const { userId, totalPoints, exactScores, outcomeHits } = sorted[i]
      await p.ranking.upsert({
        where: { userId_phaseId: { userId, phaseId } },
        update: { totalPoints, exactScores, outcomeHits, position: i + 1 },
        create: { phaseId, userId, totalPoints, exactScores, outcomeHits, position: i + 1 },
      })
    }
    console.log(`Ranking fase ${phaseId} recalculado.`)
  }
}

await p.$disconnect()

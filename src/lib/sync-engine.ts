// Motor de sincronização — usa football-data.org API
import { PrismaClient } from '@prisma/client'
import { fetchMatchesForSync, mapFDStatus, normalizeTeamName, type FDMatch } from './football-api'
import { calculateScore, type ScoreRuleKey } from './scoring'
import { sendMatchPush } from './push-notifications'

export interface SyncResult {
  checked: number
  updated: number
  scored: number
  errors: string[]
  matches: { name: string; status: string; score: string }[]
}

export async function syncMatches(prisma: PrismaClient): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, updated: 0, scored: 0, errors: [], matches: [] }

  // 1. Busca partidas da API
  let fixtures: FDMatch[]
  try {
    fixtures = await fetchMatchesForSync()
  } catch (e) {
    result.errors.push(`Falha ao buscar API: ${String(e)}`)
    return result
  }

  if (fixtures.length === 0) {
    result.errors.push('Nenhuma partida retornada pela API hoje')
    return result
  }

  result.checked = fixtures.length

  // 2. Carrega partidas do DB que ainda não finalizaram
  const dbMatches = await prisma.match.findMany({
    where: { matchStatus: { in: ['SCHEDULED', 'LIVE', 'POSTPONED'] } },
  })

  // 3. Índice nome→partida para busca rápida
  const dbIndex = new Map<string, typeof dbMatches[0]>()
  for (const m of dbMatches) {
    dbIndex.set(`${m.selection1}|${m.selection2}`, m)
    dbIndex.set(`${m.selection2}|${m.selection1}`, m)
  }

  // 4. Regras de pontuação
  const rawRules = await prisma.scoreRule.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
  const rules = Object.fromEntries(rawRules.map(r => [r.ruleKey, r.points])) as Partial<Record<ScoreRuleKey, number>>

  // 5. Processa cada partida da API
  for (const fixture of fixtures) {
    const home = normalizeTeamName(fixture.homeTeam.name)
    const away = normalizeTeamName(fixture.awayTeam.name)

    if (!home || !away) continue

    const key = `${home}|${away}`
    const dbMatch = dbIndex.get(key)
    if (!dbMatch) continue

    const newStatus = mapFDStatus(fixture.status)
    const ft = fixture.score.fullTime

    // Determina direção dos gols (home→sel1 ou invertido)
    const isReversed = dbMatch.selection1 === away
    const score1 = ft.home !== null ? (isReversed ? ft.away : ft.home) : null
    const score2 = ft.home !== null ? (isReversed ? ft.home : ft.away) : null

    const statusChanged = dbMatch.matchStatus !== newStatus
    const scoreChanged =
      score1 !== null && score2 !== null &&
      (dbMatch.officialScore1 !== score1 || dbMatch.officialScore2 !== score2)

    if (!statusChanged && !scoreChanged) continue

    // 6. Atualiza partida
    await prisma.match.update({
      where: { id: dbMatch.id },
      data: {
        matchStatus: newStatus,
        officialScore1: score1 ?? dbMatch.officialScore1,
        officialScore2: score2 ?? dbMatch.officialScore2,
      },
    })
    result.updated++

    // 7. Push notification ao mudar para LIVE ou FINISHED
    if (statusChanged && (newStatus === 'LIVE' || newStatus === 'FINISHED')) {
      sendMatchPush(prisma, {
        selection1: dbMatch.selection1,
        selection2: dbMatch.selection2,
        status: newStatus,
        score1: newStatus === 'FINISHED' ? (score1 ?? dbMatch.officialScore1) : null,
        score2: newStatus === 'FINISHED' ? (score2 ?? dbMatch.officialScore2) : null,
      }).catch(() => {})
    }

    const label = `${dbMatch.selection1} × ${dbMatch.selection2}`
    const scoreLabel = score1 !== null && score2 !== null ? `${score1}×${score2}` : '?×?'
    result.matches.push({ name: label, status: newStatus, score: scoreLabel })

    // 7. Auto-pontua palpites quando partida encerra
    if (newStatus === 'FINISHED' && score1 !== null && score2 !== null) {
      const alreadyScored = await prisma.prediction.count({
        where: { matchId: dbMatch.id, status: 'SCORED' },
      })
      if (alreadyScored > 0) continue

      const predictions = await prisma.prediction.findMany({
        where: { matchId: dbMatch.id, status: { in: ['SAVED', 'LOCKED', 'DRAFT'] } },
      })

      for (const pred of predictions) {
        const scored = calculateScore(score1, score2, pred.predictedScore1, pred.predictedScore2, rules)
        await prisma.prediction.update({
          where: { id: pred.id },
          data: {
            status: 'SCORED',
            pointsAwarded: scored.points,
            exactScoreHit: scored.exactScoreHit,
            outcomeHit: scored.outcomeHit,
            scoringDetail: scored.detail,
          },
        })
      }

      await recalculateRanking(prisma, dbMatch.phaseId)
      result.scored++
    }
  }

  return result
}

async function recalculateRanking(prisma: PrismaClient, phaseId: string) {
  const entries = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { phaseId, status: 'SCORED' },
    _sum: { pointsAwarded: true },
  })

  const exactCounts = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { phaseId, status: 'SCORED', exactScoreHit: true },
    _count: { id: true },
  })
  const exactMap = new Map(exactCounts.map(e => [e.userId, e._count.id]))

  const outcomeCounts = await prisma.prediction.groupBy({
    by: ['userId'],
    where: { phaseId, status: 'SCORED', outcomeHit: true },
    _count: { id: true },
  })
  const outcomeMap = new Map(outcomeCounts.map(e => [e.userId, e._count.id]))

  const sorted = entries
    .map(e => ({
      userId: e.userId,
      totalPoints: e._sum.pointsAwarded ?? 0,
      exactScores: exactMap.get(e.userId) ?? 0,
      outcomeHits: outcomeMap.get(e.userId) ?? 0,
    }))
    .sort((a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactScores - a.exactScores ||
      b.outcomeHits - a.outcomeHits
    )

  for (let i = 0; i < sorted.length; i++) {
    const { userId, totalPoints, exactScores, outcomeHits } = sorted[i]
    await prisma.ranking.upsert({
      where: { userId_phaseId: { userId, phaseId } },
      update: { totalPoints, exactScores, outcomeHits, position: i + 1 },
      create: { phaseId, userId, totalPoints, exactScores, outcomeHits, position: i + 1 },
    })
  }
}

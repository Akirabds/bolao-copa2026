export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { calculateScore } from '@/lib/scoring'
import { z } from 'zod'

const schema = z.object({
  matchId: z.string(),
  score1: z.number().int().min(0).max(99),
  score2: z.number().int().min(0).max(99),
  notes: z.string().optional(),
})

// POST — lançar resultado oficial e recalcular pontuação
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { matchId, score1, score2, notes } = parsed.data

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ success: false, error: 'Partida não encontrada' }, { status: 404 })

    // Buscar regras de pontuação da tabela score_rules
    const rawRules = await prisma.scoreRule.findMany({ where: { isActive: true } })
    const rules = Object.fromEntries(rawRules.map(r => [r.ruleKey, r.points]))

    // Salvar resultado
    const oldScore1 = match.officialScore1
    const oldScore2 = match.officialScore2

    await prisma.match.update({
      where: { id: matchId },
      data: {
        officialScore1: score1,
        officialScore2: score2,
        matchStatus: 'FINISHED',
        resultConfirmedAt: new Date(),
      },
    })

    // Log do resultado
    await prisma.matchResultLog.create({
      data: {
        matchId,
        score1,
        score2,
        confirmedBy: session.userId,
        action: oldScore1 !== null ? 'CORRECT' : 'SET',
        notes,
      },
    })

    // Buscar todos os palpites desta partida
    const predictions = await prisma.prediction.findMany({ where: { matchId } })

    // Calcular pontuação de cada palpite
    for (const pred of predictions) {
      const result = calculateScore(score1, score2, pred.predictedScore1, pred.predictedScore2, rules)

      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          pointsAwarded: result.points,
          exactScoreHit: result.exactScoreHit,
          outcomeHit: result.outcomeHit,
          status: 'SCORED',
          scoringDetail: result.detail,
        },
      })

      // Recalcular ranking
      const allPredictions = await prisma.prediction.findMany({
        where: { userId: pred.userId, phaseId: pred.phaseId, status: 'SCORED' },
      })

      const totalPoints = allPredictions.reduce((s, p) => s + (p.pointsAwarded || 0), 0)
      const exactScores = allPredictions.filter(p => p.exactScoreHit).length
      const outcomeHits = allPredictions.filter(p => p.outcomeHit).length
      const lastPredictionAt = allPredictions.reduce((latest, p) => {
        const t = new Date(p.updatedAt)
        return latest === null || t > latest ? t : latest
      }, null as Date | null)

      await prisma.ranking.upsert({
        where: { userId_phaseId: { userId: pred.userId, phaseId: pred.phaseId } },
        update: { totalPoints, exactScores, outcomeHits, predictionsCount: allPredictions.length, lastPredictionAt },
        create: {
          userId: pred.userId,
          phaseId: pred.phaseId,
          totalPoints,
          exactScores,
          outcomeHits,
          predictionsCount: allPredictions.length,
          lastPredictionAt,
        },
      })
    }

    // Atualizar posições no ranking
    await recalculatePositions(match.phaseId)

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        action: 'SET_RESULT',
        entity: 'Match',
        entityId: matchId,
        oldData: JSON.stringify({ score1: oldScore1, score2: oldScore2 }),
        newData: JSON.stringify({ score1, score2, notes }),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Resultado ${score1}x${score2} registrado. ${predictions.length} palpites apurados.`,
    })
  } catch (e) {
    console.error('[ADMIN RESULTS]', e)
    return NextResponse.json({ success: false, error: 'Erro ao registrar resultado' }, { status: 500 })
  }
}

// DELETE — desfazer resultado de uma partida
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const { matchId } = await req.json()
    if (!matchId) return NextResponse.json({ success: false, error: 'matchId obrigatório' }, { status: 400 })

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return NextResponse.json({ success: false, error: 'Partida não encontrada' }, { status: 404 })
    if (match.officialScore1 === null) return NextResponse.json({ success: false, error: 'Esta partida não tem resultado lançado' }, { status: 400 })

    // Resetar resultado da partida
    await prisma.match.update({
      where: { id: matchId },
      data: {
        officialScore1: null,
        officialScore2: null,
        matchStatus: 'SCHEDULED',
        resultConfirmedAt: null,
      },
    })

    // Resetar palpites desta partida
    const predictions = await prisma.prediction.findMany({ where: { matchId } })
    for (const pred of predictions) {
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          pointsAwarded: null,
          exactScoreHit: false,
          outcomeHit: false,
          status: 'SAVED',
          scoringDetail: null,
        },
      })

      // Recalcular ranking sem os pontos desta partida
      const remaining = await prisma.prediction.findMany({
        where: { userId: pred.userId, phaseId: pred.phaseId, status: 'SCORED' },
      })
      const totalPoints = remaining.reduce((s, p) => s + (p.pointsAwarded || 0), 0)
      const exactScores = remaining.filter(p => p.exactScoreHit).length
      const outcomeHits = remaining.filter(p => p.outcomeHit).length

      await prisma.ranking.upsert({
        where: { userId_phaseId: { userId: pred.userId, phaseId: pred.phaseId } },
        update: { totalPoints, exactScores, outcomeHits, predictionsCount: remaining.length },
        create: { userId: pred.userId, phaseId: pred.phaseId, totalPoints, exactScores, outcomeHits, predictionsCount: remaining.length },
      })
    }

    await recalculatePositions(match.phaseId)

    await prisma.matchResultLog.create({
      data: { matchId, score1: match.officialScore1!, score2: match.officialScore2!, confirmedBy: session.userId, action: 'UNDO', notes: 'Resultado desfeito pelo admin' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name,
        action: 'UNDO_RESULT', entity: 'Match', entityId: matchId,
        oldData: JSON.stringify({ score1: match.officialScore1, score2: match.officialScore2 }),
      },
    })

    return NextResponse.json({ success: true, message: `Resultado desfeito. ${predictions.length} palpites resetados.` })
  } catch (e) {
    console.error('[ADMIN RESULTS DELETE]', e)
    return NextResponse.json({ success: false, error: 'Erro ao desfazer resultado' }, { status: 500 })
  }
}

async function recalculatePositions(phaseId: string) {
  const rankings = await prisma.ranking.findMany({
    where: { phaseId },
    orderBy: [
      { totalPoints: 'desc' },
      { exactScores: 'desc' },
      { outcomeHits: 'desc' },
      { lastPredictionAt: 'asc' },
    ],
  })

  await Promise.all(
    rankings.map((r, idx) => prisma.ranking.update({ where: { id: r.id }, data: { position: idx + 1 } }))
  )
}

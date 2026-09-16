export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const [phase1Access, phase2Access, phase1Payment, phase2Payment, phase1Ranking, phase2Ranking] =
    await Promise.all([
      fase1 ? prisma.phaseAccess.findUnique({ where: { userId_phaseId: { userId: session.userId, phaseId: fase1.id } } }) : null,
      fase2 ? prisma.phaseAccess.findUnique({ where: { userId_phaseId: { userId: session.userId, phaseId: fase2.id } } }) : null,
      fase1 ? prisma.payment.findFirst({ where: { userId: session.userId, phaseId: fase1.id }, orderBy: { createdAt: 'desc' } }) : null,
      fase2 ? prisma.payment.findFirst({ where: { userId: session.userId, phaseId: fase2.id }, orderBy: { createdAt: 'desc' } }) : null,
      fase1 ? prisma.ranking.findUnique({ where: { userId_phaseId: { userId: session.userId, phaseId: fase1.id } } }) : null,
      fase2 ? prisma.ranking.findUnique({ where: { userId_phaseId: { userId: session.userId, phaseId: fase2.id } } }) : null,
    ])

  // Contagem de palpites
  const phase1Progress = fase1
    ? await getProgress(session.userId, fase1.id)
    : { total: 0, filled: 0, locked: 0 }

  const phase2Progress = fase2
    ? await getProgress(session.userId, fase2.id)
    : { total: 0, filled: 0, locked: 0 }

  // Posição no ranking
  let phase1Position: number | null = null
  let phase2Position: number | null = null

  if (fase1 && phase1Ranking) {
    const rank1 = await prisma.ranking.count({
      where: { phaseId: fase1.id, totalPoints: { gt: phase1Ranking.totalPoints } },
    })
    phase1Position = rank1 + 1
  }

  return NextResponse.json({
    success: true,
    data: {
      fase1,
      fase2,
      phase1Access,
      phase2Access,
      phase1Payment,
      phase2Payment,
      phase1Ranking: phase1Ranking ? { ...phase1Ranking, position: phase1Position } : null,
      phase2Ranking: phase2Ranking ? { ...phase2Ranking, position: phase2Position } : null,
      phase1Progress,
      phase2Progress,
    },
  })
}

async function getProgress(userId: string, phaseId: string) {
  const now = new Date()
  const [total, filled, locked] = await Promise.all([
    prisma.match.count({ where: { phaseId } }),
    prisma.prediction.count({ where: { userId, phaseId } }),
    prisma.match.count({ where: { phaseId, OR: [{ kickoffAt: { lte: now } }, { predictionDeadlineAt: { lte: now } }] } }),
  ])
  return { total, filled, locked }
}

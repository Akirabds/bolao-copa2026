export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const { searchParams } = new URL(req.url)
    const phaseSlug = searchParams.get('phase') || 'fase1'
    const group = searchParams.get('group')

    const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
    if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

    const where: any = { phaseId: phase.id }
    if (group) where.groupCode = group

    const matches = await prisma.match.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { kickoffAt: 'asc' }],
    })

    // Se autenticado, buscar palpites do usuário
    let predictions: any[] = []
    if (session) {
      predictions = await prisma.prediction.findMany({
        where: { userId: session.userId, phaseId: phase.id },
      })
    }

    const predMap = Object.fromEntries(predictions.map(p => [p.matchId, p]))

    const enriched = matches.map(m => ({
      ...m,
      prediction: predMap[m.id] || null,
      isLocked: isMatchLocked(m.kickoffAt, m.predictionDeadlineAt),
    }))

    return NextResponse.json({ success: true, data: { phase, matches: enriched } })
  } catch (e) {
    console.error('[MATCHES GET]', e)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

function isMatchLocked(kickoffAt: Date, deadlineAt: Date | null): boolean {
  const deadline = deadlineAt || kickoffAt
  return new Date() >= new Date(deadline)
}

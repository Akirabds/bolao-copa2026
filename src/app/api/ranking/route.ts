export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phaseSlug = searchParams.get('phase') || 'fase1'

  const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
  if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

  const rankings = await prisma.ranking.findMany({
    where: { phaseId: phase.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [
      { totalPoints: 'desc' },
      { exactScores: 'desc' },
      { outcomeHits: 'desc' },
      { lastPredictionAt: 'asc' },
    ],
  })

  // Atribuir posições
  const ranked = rankings.map((r, idx) => ({ ...r, position: idx + 1 }))

  return NextResponse.json({ success: true, data: { phase, rankings: ranked } })
}

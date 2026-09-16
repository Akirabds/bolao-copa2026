export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  matchId: z.string(),
  phaseId: z.string(),
  predictedScore1: z.number().int().min(0).max(99),
  predictedScore2: z.number().int().min(0).max(99),
})

const bulkSchema = z.object({
  predictions: z.array(schema),
})

// GET — buscar palpites do usuário
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const phaseSlug = searchParams.get('phase') || 'fase1'

  const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
  if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.userId, phaseId: phase.id },
    include: { match: true },
    orderBy: { match: { kickoffAt: 'asc' } },
  })

  return NextResponse.json({ success: true, data: predictions })
}

// POST — salvar/atualizar palpite(s)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()

    // Suporta salvar um palpite único ou múltiplos
    const items = Array.isArray(body.predictions) ? body.predictions : [body]
    const parsed = bulkSchema.safeParse({ predictions: items })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const results = []
    const now = new Date()

    for (const item of parsed.data.predictions) {
      // Verificar se o jogo existe e não está bloqueado
      const match = await prisma.match.findUnique({ where: { id: item.matchId } })
      if (!match) continue

      const deadline = match.predictionDeadlineAt || match.kickoffAt
      if (now >= new Date(deadline)) {
        results.push({ matchId: item.matchId, error: 'Palpite bloqueado — jogo já iniciado' })
        continue
      }

      // Verificar acesso à fase
      const phase = await prisma.phase.findUnique({ where: { id: item.phaseId } })
      if (!phase) continue

      // Fase deve estar aberta para palpites
      if (phase.status !== 'OPEN_FOR_PREDICTIONS') {
        results.push({ matchId: item.matchId, error: 'Esta fase ainda não está aberta para palpites' })
        continue
      }

      // Fase 1: verificar pagamento aprovado
      // Fase 2: verificar pagamento aprovado E fase 1 encerrada
      const access = await prisma.phaseAccess.findUnique({
        where: { userId_phaseId: { userId: session.userId, phaseId: item.phaseId } },
      })

      if (!access || access.status !== 'ACCESS_GRANTED') {
        if (phase.slug === 'fase2') {
          // Pode ser AWAITING_PHASE_RELEASE
          if (access?.status === 'AWAITING_PHASE_RELEASE') {
            results.push({ matchId: item.matchId, error: 'Aguardando encerramento da Fase 1' })
          } else {
            results.push({ matchId: item.matchId, error: 'Sem acesso à Fase 2' })
          }
        } else {
          results.push({ matchId: item.matchId, error: 'Sem acesso a esta fase' })
        }
        continue
      }

      const prediction = await prisma.prediction.upsert({
        where: { userId_matchId: { userId: session.userId, matchId: item.matchId } },
        update: {
          predictedScore1: item.predictedScore1,
          predictedScore2: item.predictedScore2,
          status: 'SAVED',
          updatedAt: now,
        },
        create: {
          userId: session.userId,
          matchId: item.matchId,
          phaseId: item.phaseId,
          predictedScore1: item.predictedScore1,
          predictedScore2: item.predictedScore2,
          status: 'SAVED',
          submittedAt: now,
        },
      })

      // Atualizar lastPredictionAt no ranking
      await prisma.ranking.upsert({
        where: { userId_phaseId: { userId: session.userId, phaseId: item.phaseId } },
        update: { lastPredictionAt: now },
        create: {
          userId: session.userId,
          phaseId: item.phaseId,
          lastPredictionAt: now,
          totalPoints: 0,
        },
      })

      results.push({ matchId: item.matchId, prediction, success: true })
    }

    return NextResponse.json({ success: true, data: results })
  } catch (e) {
    console.error('[PREDICTIONS POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao salvar palpite' }, { status: 500 })
  }
}

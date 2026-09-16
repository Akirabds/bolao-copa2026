export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['PRE_REGISTRATION', 'OPEN_FOR_PAYMENT', 'OPEN_FOR_PREDICTIONS', 'CLOSED', 'SETTLED', 'PRIZED']),
})

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { status } = parsed.data
  const phase = await prisma.phase.findUnique({ where: { slug: params.slug } })
  if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

  const now = new Date()
  const data: any = { status }

  if (status === 'OPEN_FOR_PREDICTIONS') data.openedAt = now
  if (status === 'CLOSED') data.closedAt = now
  if (status === 'SETTLED') data.settledAt = now

  // Quando Fase 1 fecha, liberar acesso aguardando da Fase 2
  if (params.slug === 'fase1' && ['CLOSED', 'SETTLED', 'PRIZED'].includes(status)) {
    const fase2 = await prisma.phase.findUnique({ where: { slug: 'fase2' } })
    if (fase2) {
      await prisma.phaseAccess.updateMany({
        where: { phaseId: fase2.id, status: 'AWAITING_PHASE_RELEASE' },
        data: { status: 'ACCESS_GRANTED', grantedAt: now },
      })

      // Criar rankings para quem estava aguardando
      const newlyGranted = await prisma.phaseAccess.findMany({
        where: { phaseId: fase2.id, status: 'ACCESS_GRANTED' },
      })
      for (const access of newlyGranted) {
        await prisma.ranking.upsert({
          where: { userId_phaseId: { userId: access.userId, phaseId: fase2.id } },
          update: {},
          create: { userId: access.userId, phaseId: fase2.id, totalPoints: 0 },
        })
      }
    }
  }

  await prisma.phase.update({ where: { slug: params.slug }, data })

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: session.name,
      action: 'UPDATE_PHASE_STATUS',
      entity: 'Phase',
      entityId: phase.id,
      oldData: JSON.stringify({ status: phase.status }),
      newData: JSON.stringify({ status }),
    },
  })

  return NextResponse.json({ success: true, message: `Fase atualizada para: ${status}` })
}

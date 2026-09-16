export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED', 'IN_ANALYSIS']),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { status, notes } = parsed.data
    const payment = await prisma.payment.findUnique({ where: { id: params.id }, include: { phase: true } })
    if (!payment) return NextResponse.json({ success: false, error: 'Pagamento não encontrado' }, { status: 404 })

    const oldStatus = payment.status

    await prisma.payment.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: status === 'APPROVED' ? new Date() : payment.paidAt,
        approvedBy: status === 'APPROVED' ? session.userId : payment.approvedBy,
        notes: notes || payment.notes,
      },
    })

    await prisma.paymentEvent.create({
      data: { paymentId: payment.id, status, source: 'manual', rawData: JSON.stringify({ approvedBy: session.userId, notes }) },
    })

    // Atualizar acesso à fase baseado no novo status
    if (status === 'APPROVED') {
      const fase1 = await prisma.phase.findUnique({ where: { slug: 'fase1' } })
      const fase1Ended = fase1 && ['CLOSED', 'SETTLED', 'PRIZED'].includes(fase1.status)

      let accessStatus: string
      if (payment.phase.slug === 'fase1') {
        accessStatus = 'ACCESS_GRANTED'
      } else if (payment.phase.slug === 'fase2') {
        // Liberar apenas se Fase 1 estiver encerrada
        accessStatus = fase1Ended ? 'ACCESS_GRANTED' : 'AWAITING_PHASE_RELEASE'
      } else {
        accessStatus = 'ACCESS_GRANTED'
      }

      await prisma.phaseAccess.upsert({
        where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
        update: { status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
        create: {
          userId: payment.userId,
          phaseId: payment.phaseId,
          status: accessStatus,
          grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined,
        },
      })

      // Criar entrada no ranking se não existir
      if (accessStatus === 'ACCESS_GRANTED') {
        await prisma.ranking.upsert({
          where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
          update: {},
          create: { userId: payment.userId, phaseId: payment.phaseId, totalPoints: 0 },
        })
      }
    } else if (['REJECTED', 'CANCELLED'].includes(status)) {
      await prisma.phaseAccess.upsert({
        where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
        update: { status: 'PENDING' },
        create: { userId: payment.userId, phaseId: payment.phaseId, status: 'PENDING' },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        action: 'UPDATE_PAYMENT_STATUS',
        entity: 'Payment',
        entityId: payment.id,
        oldData: JSON.stringify({ status: oldStatus }),
        newData: JSON.stringify({ status, notes }),
      },
    })

    return NextResponse.json({ success: true, message: `Pagamento atualizado para: ${status}` })
  } catch (e) {
    console.error('[ADMIN PAYMENT PATCH]', e)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { id: params.id }, include: { phase: true } })
    if (!payment) return NextResponse.json({ success: false, error: 'Pagamento não encontrado' }, { status: 404 })

    // Remover eventos e pagamento
    await prisma.paymentEvent.deleteMany({ where: { paymentId: payment.id } })
    await prisma.payment.delete({ where: { id: payment.id } })

    // Verificar se ainda há outro pagamento aprovado para esta fase
    const otherApproved = await prisma.payment.findFirst({
      where: { userId: payment.userId, phaseId: payment.phaseId, status: 'APPROVED' },
    })

    if (!otherApproved) {
      await prisma.phaseAccess.upsert({
        where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
        update: { status: 'PENDING', grantedAt: null },
        create: { userId: payment.userId, phaseId: payment.phaseId, status: 'PENDING' },
      })
      await prisma.ranking.deleteMany({ where: { userId: payment.userId, phaseId: payment.phaseId } })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name,
        action: 'DELETE_PAYMENT', entity: 'Payment', entityId: payment.id,
        oldData: JSON.stringify({ status: payment.status, amount: payment.amount, phase: payment.phase.slug }),
      },
    })

    return NextResponse.json({ success: true, message: 'Pagamento excluído' })
  } catch (e) {
    console.error('[ADMIN PAYMENT DELETE]', e)
    return NextResponse.json({ success: false, error: 'Erro ao excluir pagamento' }, { status: 500 })
  }
}

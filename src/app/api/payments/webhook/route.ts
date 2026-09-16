export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// InfinityPay envia POST JSON com dados da transação após pagamento confirmado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const orderNsu: string = body?.order_nsu ?? ''
    if (!orderNsu.startsWith('bolao-')) return NextResponse.json({ ok: true })

    const paymentId = orderNsu.replace('bolao-', '')
    const isPaid = body?.paid === true || ['approved', 'pix', 'credit_card'].includes(
      (body?.status ?? body?.capture_method ?? '').toLowerCase()
    )

    if (!isPaid) return NextResponse.json({ ok: true })

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { phase: true },
    })
    if (!payment || payment.status === 'APPROVED') return NextResponse.json({ ok: true })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'APPROVED', paidAt: new Date() },
    })

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        status: 'APPROVED',
        source: 'webhook',
        rawData: JSON.stringify(body),
      },
    })

    const fase1 = await prisma.phase.findUnique({ where: { slug: 'fase1' } })
    const fase1Ended = fase1 && ['CLOSED', 'SETTLED', 'PRIZED'].includes(fase1.status)
    const accessStatus = payment.phase.slug === 'fase2' && !fase1Ended ? 'AWAITING_PHASE_RELEASE' : 'ACCESS_GRANTED'

    await prisma.phaseAccess.upsert({
      where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
      update: { status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
      create: { userId: payment.userId, phaseId: payment.phaseId, status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
    })

    if (accessStatus === 'ACCESS_GRANTED') {
      await prisma.ranking.upsert({
        where: { userId_phaseId: { userId: payment.userId, phaseId: payment.phaseId } },
        update: {},
        create: { userId: payment.userId, phaseId: payment.phaseId, totalPoints: 0 },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[WEBHOOK INFINITEPAY]', e)
    return NextResponse.json({ ok: true })
  }
}

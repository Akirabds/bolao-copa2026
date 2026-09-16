export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { checkPayment } from '@/lib/infinitepay'

// GET /api/payments/retorno?ref=bolao-{paymentId}&transaction_nsu=xxx&slug=xxx
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ status: 'UNAUTHORIZED' }, { status: 401 })

  const ref = req.nextUrl.searchParams.get('ref') ?? ''
  const transactionNsu = req.nextUrl.searchParams.get('transaction_nsu') ?? ''
  const slug = req.nextUrl.searchParams.get('slug') ?? ''

  const paymentId = ref.replace('bolao-', '')
  if (!paymentId) return NextResponse.json({ status: 'INVALID' })

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: session.userId },
    include: { phase: true },
  })
  if (!payment) return NextResponse.json({ status: 'NOT_FOUND' })

  if (payment.status === 'APPROVED') return NextResponse.json({ status: 'APPROVED' })
  if (payment.status === 'REJECTED') return NextResponse.json({ status: 'REJECTED' })

  if (!transactionNsu || !slug) return NextResponse.json({ status: 'PENDING' })

  let paid = false
  let txStatus = 'unknown'
  try {
    const result = await checkPayment(`bolao-${paymentId}`, transactionNsu, slug)
    paid = result.paid
    txStatus = result.status
  } catch {
    return NextResponse.json({ status: 'PENDING' })
  }

  if (!paid) return NextResponse.json({ status: 'PENDING' })

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'APPROVED', paidAt: new Date() },
  })

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      status: 'APPROVED',
      source: 'retorno',
      rawData: JSON.stringify({ transactionNsu, slug, txStatus }),
    },
  })

  const fase1 = await prisma.phase.findUnique({ where: { slug: 'fase1' } })
  const fase1Ended = fase1 && ['CLOSED', 'SETTLED', 'PRIZED'].includes(fase1.status)
  const accessStatus = payment.phase.slug === 'fase2' && !fase1Ended ? 'AWAITING_PHASE_RELEASE' : 'ACCESS_GRANTED'

  await prisma.phaseAccess.upsert({
    where: { userId_phaseId: { userId: session.userId, phaseId: payment.phaseId } },
    update: { status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
    create: { userId: session.userId, phaseId: payment.phaseId, status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
  })

  if (accessStatus === 'ACCESS_GRANTED') {
    await prisma.ranking.upsert({
      where: { userId_phaseId: { userId: session.userId, phaseId: payment.phaseId } },
      update: {},
      create: { userId: session.userId, phaseId: payment.phaseId, totalPoints: 0 },
    })
  }

  return NextResponse.json({ status: 'APPROVED' })
}

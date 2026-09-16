export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'
import { createCheckout } from '@/lib/infinitepay'

const schema = z.object({
  phaseSlug: z.enum(['fase1', 'fase2']),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

    const { phaseSlug } = parsed.data

    const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
    if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

    if (!['OPEN_FOR_PAYMENT', 'OPEN_FOR_PREDICTIONS'].includes(phase.status))
      return NextResponse.json({ success: false, error: 'Esta fase não está aceitando pagamentos' }, { status: 400 })

    const existingApproved = await prisma.payment.findFirst({
      where: { userId: session.userId, phaseId: phase.id, status: 'APPROVED' },
    })
    if (existingApproved)
      return NextResponse.json({ success: false, error: 'Você já possui pagamento aprovado para esta fase' }, { status: 409 })

    // Reutilizar checkout pendente se ainda válido
    const existingPending = await prisma.payment.findFirst({
      where: {
        userId: session.userId,
        phaseId: phase.id,
        status: 'PENDING',
        gateway: 'infinitepay',
        gatewayReference: { not: null },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existingPending?.pixCode) {
      return NextResponse.json({ success: true, data: { paymentUrl: existingPending.pixCode } })
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const payment = await prisma.payment.create({
      data: {
        userId: session.userId,
        phaseId: phase.id,
        amount: phase.entryFee,
        gateway: 'infinitepay',
        status: 'PENDING',
        expiresAt,
      },
    })

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
    const redirectUrl = `${appUrl}/pagamento/retorno?ref=bolao-${payment.id}`
    const webhookUrl = `${appUrl}/api/payments/webhook`

    let checkoutResult
    try {
      checkoutResult = await createCheckout(
        payment.id,
        phase.entryFee,
        `Bolão Copa 2026 — ${phase.name}`,
        redirectUrl,
        webhookUrl,
      )
    } catch (e: any) {
      await prisma.payment.delete({ where: { id: payment.id } })
      return NextResponse.json({ success: false, error: e.message }, { status: 502 })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayReference: checkoutResult.checkoutId,
        pixCode: checkoutResult.paymentUrl,
      },
    })

    await prisma.phaseAccess.upsert({
      where: { userId_phaseId: { userId: session.userId, phaseId: phase.id } },
      update: { status: 'PENDING' },
      create: { userId: session.userId, phaseId: phase.id, status: 'PENDING' },
    })

    await prisma.paymentEvent.create({
      data: { paymentId: payment.id, status: 'PENDING', source: 'system' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name,
        action: 'PAYMENT_CREATED', entity: 'Payment', entityId: payment.id,
        newData: JSON.stringify({ phase: phaseSlug, amount: phase.entryFee, gateway: 'infinitepay' }),
      },
    })

    return NextResponse.json({ success: true, data: { paymentUrl: checkoutResult.paymentUrl } })
  } catch (e) {
    console.error('[PAYMENTS POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const payments = await prisma.payment.findMany({
    where: { userId: session.userId },
    include: { phase: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: payments })
}

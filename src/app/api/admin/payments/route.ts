export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

// POST — criar pagamento manual para um usuário
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const { userId, phaseSlug, status = 'APPROVED' } = await req.json()
    if (!userId || !phaseSlug) return NextResponse.json({ success: false, error: 'userId e phaseSlug obrigatórios' }, { status: 400 })

    const [user, phase] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.phase.findUnique({ where: { slug: phaseSlug } }),
    ])
    if (!user) return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
    if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

    const existing = await prisma.payment.findFirst({ where: { userId, phaseId: phase.id, status: 'APPROVED' } })
    if (existing) return NextResponse.json({ success: false, error: 'Usuário já tem pagamento aprovado nesta fase' }, { status: 409 })

    const payment = await prisma.payment.create({
      data: {
        userId,
        phaseId: phase.id,
        amount: phase.entryFee,
        gateway: 'manual',
        status,
        paidAt: status === 'APPROVED' ? new Date() : undefined,
        approvedBy: session.userId,
      },
    })

    await prisma.paymentEvent.create({
      data: { paymentId: payment.id, status, source: 'manual', rawData: JSON.stringify({ createdBy: session.userId }) },
    })

    if (status === 'APPROVED') {
      const fase1 = await prisma.phase.findUnique({ where: { slug: 'fase1' } })
      const fase1Ended = fase1 && ['CLOSED', 'SETTLED', 'PRIZED'].includes(fase1.status)
      const accessStatus = phase.slug === 'fase2' && !fase1Ended ? 'AWAITING_PHASE_RELEASE' : 'ACCESS_GRANTED'

      await prisma.phaseAccess.upsert({
        where: { userId_phaseId: { userId, phaseId: phase.id } },
        update: { status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
        create: { userId, phaseId: phase.id, status: accessStatus, grantedAt: accessStatus === 'ACCESS_GRANTED' ? new Date() : undefined },
      })

      if (accessStatus === 'ACCESS_GRANTED') {
        await prisma.ranking.upsert({
          where: { userId_phaseId: { userId, phaseId: phase.id } },
          update: {},
          create: { userId, phaseId: phase.id, totalPoints: 0 },
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name,
        action: 'CREATE_PAYMENT_MANUAL', entity: 'Payment', entityId: payment.id,
        newData: JSON.stringify({ userId, phase: phaseSlug, status }),
      },
    })

    return NextResponse.json({ success: true, message: `Pagamento criado para ${user.name}` })
  } catch (e) {
    console.error('[ADMIN PAYMENT POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const phase = searchParams.get('phase')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  const where: any = {}
  if (status) where.status = status
  if (phase) where.phase = { slug: phase }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        phase: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: payments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

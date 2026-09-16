export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const [
    totalUsers,
    fase1,
    fase2,
    pendingPayments,
    approvedPhase1,
    approvedPhase2,
    totalPredictions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PARTICIPANT' } }),
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'APPROVED', phase: { slug: 'fase1' } } }),
    prisma.payment.count({ where: { status: 'APPROVED', phase: { slug: 'fase2' } } }),
    prisma.prediction.count(),
  ])

  const [rev1, rev2] = await Promise.all([
    fase1 ? prisma.payment.aggregate({ where: { phaseId: fase1.id, status: 'APPROVED' }, _sum: { amount: true } }) : null,
    fase2 ? prisma.payment.aggregate({ where: { phaseId: fase2.id, status: 'APPROVED' }, _sum: { amount: true } }) : null,
  ])

  const feePercent = parseFloat(
    (await prisma.systemSetting.findUnique({ where: { key: 'platform_fee_percent' } }))?.value || '10'
  )

  const phase1Revenue = rev1?._sum.amount || 0
  const phase2Revenue = rev2?._sum.amount || 0
  const totalRevenue = phase1Revenue + phase2Revenue
  const phase1Prize = phase1Revenue * (1 - feePercent / 100)
  const phase2Prize = phase2Revenue * (1 - feePercent / 100)

  return NextResponse.json({
    success: true,
    data: {
      totalUsers,
      approvedPhase1,
      approvedPhase2,
      pendingPayments,
      totalRevenue,
      phase1Revenue,
      phase2Revenue,
      phase1Prize,
      phase2Prize,
      totalPredictions,
      fase1,
      fase2,
    },
  })
}

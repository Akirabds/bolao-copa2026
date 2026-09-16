export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  phaseSlug: z.enum(['fase1', 'fase2']),
  groupCode: z.string().optional(),
  roundLabel: z.string().optional(),
  selection1: z.string().min(1),
  selection2: z.string().min(1),
  flag1: z.string().optional(),
  flag2: z.string().optional(),
  kickoffAt: z.string(),
  location: z.string().optional(),
  stadium: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const phaseSlug = searchParams.get('phase') || 'fase1'
  const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
  if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

  const matches = await prisma.match.findMany({
    where: { phaseId: phase.id },
    orderBy: [{ sortOrder: 'asc' }, { kickoffAt: 'asc' }],
    include: { _count: { select: { predictions: true } } },
  })

  return NextResponse.json({ success: true, data: { phase, matches } })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { phaseSlug, ...rest } = parsed.data
  const phase = await prisma.phase.findUnique({ where: { slug: phaseSlug } })
  if (!phase) return NextResponse.json({ success: false, error: 'Fase não encontrada' }, { status: 404 })

  const match = await prisma.match.create({
    data: { ...rest, phaseId: phase.id, kickoffAt: new Date(rest.kickoffAt), sortOrder: Date.now() },
  })

  return NextResponse.json({ success: true, data: match })
}

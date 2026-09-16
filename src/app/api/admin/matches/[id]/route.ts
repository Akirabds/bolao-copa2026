export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { kickoffAt, ...rest } = body

  await prisma.match.update({
    where: { id: params.id },
    data: { ...rest, ...(kickoffAt ? { kickoffAt: new Date(kickoffAt) } : {}) },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  await prisma.match.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

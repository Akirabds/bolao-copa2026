export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, cpf: true, role: true, isActive: true, isBlocked: true, createdAt: true },
  })

  if (!user) return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })

  return NextResponse.json({ success: true, data: user })
}

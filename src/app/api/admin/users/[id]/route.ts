export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function adminOnly() {
  const h = headers()
  if (h.get('x-user-role') !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  return null
}

const updateSchema = z.object({
  name:      z.string().min(2).optional(),
  email:     z.string().email().optional(),
  phone:     z.string().optional().nullable(),
  cpf:       z.string().optional().nullable(),
  password:  z.string().min(6).optional(),
  isBlocked: z.boolean().optional(),
  role:      z.enum(['PARTICIPANT', 'ADMIN']).optional(),
})

// GET — busca um usuário
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const deny = adminOnly(); if (deny) return deny

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, phone: true, cpf: true, role: true, isBlocked: true, createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return NextResponse.json({ success: true, data: user })
}

// PATCH — edita um usuário
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const deny = adminOnly(); if (deny) return deny

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { password, email, ...rest } = parsed.data
  const data: Record<string, unknown> = { ...rest }

  if (password) data.passwordHash = await bcrypt.hash(password, 12)

  if (email) {
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase(), NOT: { id: params.id } } })
    if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    data.email = email.toLowerCase()
  }

  const adminId = headers().get('x-user-id') ?? 'admin'
  const user = await prisma.user.update({ where: { id: params.id }, data })

  await prisma.auditLog.create({
    data: { userId: adminId, userName: 'Admin', action: 'UPDATE_USER', entity: 'User', entityId: params.id, newData: JSON.stringify(Object.keys(data)) },
  })

  return NextResponse.json({ success: true, data: { id: user.id, name: user.name, email: user.email } })
}

// DELETE — remove um usuário
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const deny = adminOnly(); if (deny) return deny

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (user.role === 'ADMIN') return NextResponse.json({ error: 'Não é possível excluir um administrador' }, { status: 403 })

  await prisma.user.delete({ where: { id: params.id } })

  const adminId = headers().get('x-user-id') ?? 'admin'
  await prisma.auditLog.create({
    data: { userId: adminId, userName: 'Admin', action: 'DELETE_USER', entity: 'User', entityId: params.id, newData: user.email },
  })

  return NextResponse.json({ success: true })
}

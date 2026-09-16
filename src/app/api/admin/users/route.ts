export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  const where: any = {
    role: 'PARTICIPANT',
    ...(q && {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        phaseAccess: { include: { phase: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        rankings: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

const createSchema = z.object({
  name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email:    z.string().email('E-mail inválido'),
  phone:    z.string().optional(),
  cpf:      z.string().optional(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role:     z.enum(['PARTICIPANT', 'ADMIN']).default('PARTICIPANT'),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  const { name, email, phone, cpf, password, role } = parsed.data
  const normalEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: normalEmail } })
  if (existing)
    return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 409 })

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalEmail, phone: phone || null, cpf: cpf || null, passwordHash: await bcrypt.hash(password, 12), role },
  })

  await prisma.auditLog.create({
    data: { userId: session.userId, userName: session.name, action: 'CREATE_USER', entity: 'User', entityId: user.id, newData: normalEmail },
  })

  return NextResponse.json({ success: true, data: { id: user.id, name: user.name, email: user.email } }, { status: 201 })
}

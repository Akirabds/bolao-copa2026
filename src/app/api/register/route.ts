export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, createAuthCookie } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Você deve aceitar o regulamento' }) }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, phone, cpf, password } = parsed.data
    const normalEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email: normalEmail } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: 'allow_new_registrations' } })
    if (setting?.value === 'false') {
      return NextResponse.json({ success: false, error: 'Cadastros temporariamente suspensos.' }, { status: 403 })
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalEmail,
        phone: phone?.trim() || null,
        cpf: cpf?.trim() || null,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'PARTICIPANT',
      },
    })

    // Registrar aceite dos termos
    const termsVersion = (await prisma.systemSetting.findUnique({ where: { key: 'terms_version' } }))?.value?.replace(/"/g, '') || '1.0'
    await prisma.termsAcceptance.create({
      data: { userId: user.id, version: termsVersion, ipAddress: req.headers.get('x-forwarded-for') || 'unknown' },
    })

    // Fase 1 é gratuita — liberar acesso automaticamente
    const fase1 = await prisma.phase.findUnique({ where: { slug: 'fase1' } })
    if (fase1) {
      await prisma.phaseAccess.create({
        data: { userId: user.id, phaseId: fase1.id, status: 'ACCESS_GRANTED', grantedAt: new Date() },
      })
    }

    await prisma.auditLog.create({
      data: { userId: user.id, userName: user.name, action: 'REGISTER', entity: 'User', entityId: user.id },
    })

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: 'PARTICIPANT' })
    const cookie = createAuthCookie(token)

    const response = NextResponse.json({ success: true, data: { name: user.name, redirectTo: '/dashboard' } }, { status: 201 })
    response.cookies.set(cookie)
    return response
  } catch (e) {
    console.error('[REGISTER]', e)
    return NextResponse.json({ success: false, error: 'Erro ao criar conta' }, { status: 500 })
  }
}

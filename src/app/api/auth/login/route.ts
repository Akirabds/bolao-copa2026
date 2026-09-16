export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, createAuthCookie } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    if (user.isBlocked) {
      return NextResponse.json({ success: false, error: 'Conta bloqueada. Entre em contato com o suporte.' }, { status: 403 })
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Conta inativa.' }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'PARTICIPANT' | 'ADMIN',
    })

    const cookie = createAuthCookie(token)
    const response = NextResponse.json({
      success: true,
      data: { role: user.role, name: user.name, redirectTo: user.role === 'ADMIN' ? '/admin' : '/dashboard' },
    })
    response.cookies.set(cookie)
    return response
  } catch (e) {
    console.error('[AUTH LOGIN]', e)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

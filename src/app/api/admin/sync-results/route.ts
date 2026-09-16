export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { syncMatches } from '@/lib/sync-engine'

const prisma = new PrismaClient()

// GET — status da última sincronização
export async function GET() {
  const h = headers()
  const role = h.get('x-user-role')
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const setting = await prisma.systemSetting.findUnique({ where: { key: 'last_sync' } })
  const apiKeySet = !!process.env.FOOTBALL_API_KEY

  return NextResponse.json({
    success: true,
    data: {
      lastSync: setting?.value ?? null,
      apiKeyConfigured: apiKeySet,
    },
  })
}

// POST — dispara sincronização manual
export async function POST(req: Request) {
  const h = headers()
  const role = h.get('x-user-role')

  // Aceita tanto admin logado quanto chamada via SYNC_SECRET (cron job)
  const body = await req.json().catch(() => ({}))
  const secret = body?.secret ?? req.headers.get('x-sync-secret')
  const validSecret = secret && secret === process.env.SYNC_SECRET

  if (role !== 'ADMIN' && !validSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (!process.env.FOOTBALL_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'FOOTBALL_API_KEY não configurada no .env' },
      { status: 400 }
    )
  }

  try {
    const result = await syncMatches(prisma)

    // Salva timestamp da última sync
    await prisma.systemSetting.upsert({
      where: { key: 'last_sync' },
      update: { value: new Date().toISOString() },
      create: { key: 'last_sync', value: new Date().toISOString(), label: 'Última sincronização automática' },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    console.error('[SYNC ERROR]', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

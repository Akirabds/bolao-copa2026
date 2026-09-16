export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  const cookie = clearAuthCookie()
  response.cookies.set(cookie)
  return response
}

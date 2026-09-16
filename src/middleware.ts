import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/regulamento', '/api/auth', '/api/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Sempre permitir arquivos estáticos e Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Webhooks e endpoints públicos de pagamento
  if (pathname.startsWith('/api/webhooks') || pathname === '/api/payments/webhook' || pathname === '/api/payments/card-key') {
    return NextResponse.next()
  }

  // Sync endpoint: permite acesso via SYNC_SECRET sem sessão
  if (pathname === '/api/admin/sync-results') {
    const secret = req.headers.get('x-sync-secret') ?? req.nextUrl.searchParams.get('secret')
    if (secret && secret === process.env.SYNC_SECRET) {
      return NextResponse.next()
    }
  }

  // Verificar se é rota pública
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  const session = await getSessionFromRequest(req)

  if (!session) {
    if (isPublic) return NextResponse.next()
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirecionar usuário já logado que tenta acessar login/cadastro
  if (session && (pathname === '/login' || pathname === '/cadastro')) {
    const url = req.nextUrl.clone()
    url.pathname = session.role === 'ADMIN' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Proteger rotas admin
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Adicionar info do usuário nos headers para uso nos Server Components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-role', session.role)
  requestHeaders.set('x-user-name', session.name)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

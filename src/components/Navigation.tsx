'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Trophy, LayoutDashboard, Target, Star, User, Menu, X,
  LogOut, ShieldCheck, ChevronDown, RefreshCw, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

interface NavProps {
  userName: string
  role: 'PARTICIPANT' | 'ADMIN'
}

const participantLinks = [
  { href: '/dashboard',    label: 'Início',      icon: LayoutDashboard },
  { href: '/fase/fase1',   label: 'Fase 1',      icon: Target },
  { href: '/fase/fase2',   label: 'Fase 2',      icon: Star },
  { href: '/ranking',      label: 'Ranking',     icon: Trophy },
  { href: '/perfil',       label: 'Meu Perfil',  icon: User },
  { href: '/regulamento',  label: 'Regulamento', icon: BookOpen },
]

const adminLinks = [
  { href: '/admin',              label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/partidas',     label: 'Partidas',   icon: Target },
  { href: '/admin/resultados',   label: 'Resultados', icon: Trophy },
  { href: '/admin/pagamentos',   label: 'Pagamentos', icon: Star },
  { href: '/admin/usuarios',     label: 'Usuários',   icon: User },
  { href: '/admin/fases',        label: 'Fases',      icon: ShieldCheck },
  { href: '/admin/premiacao',    label: 'Premiação',  icon: Trophy },
  { href: '/admin/sync',         label: 'Sync API',   icon: RefreshCw },
]

export function Navigation({ userName, role }: NavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const links = role === 'ADMIN' ? adminLinks : participantLinks

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface-card border-r border-[#2a3147] fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a3147]">
          <Link href={role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-white">Bolão da Copa</p>
              <p className="text-xs text-brand-400 font-semibold">2026</p>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {role === 'ADMIN' && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">Admin</p>
          )}
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50'
                )}
              >
                <Icon size={18} className={active ? 'text-brand-400' : 'text-slate-500'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#2a3147]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand-600/20 border border-brand-600/30 rounded-full flex items-center justify-center">
              <span className="text-brand-400 font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500">{role === 'ADMIN' ? 'Administrador' : 'Participante'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost btn-sm w-full justify-start gap-2 text-slate-400 hover:text-red-400">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-card border-b border-[#2a3147]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href={role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white">Bolão Copa 2026</span>
          </Link>
          <button onClick={() => setOpen(!open)} className="p-2 text-slate-400 hover:text-white">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-[#2a3147] bg-surface-card pb-4 animate-slide-in">
            <nav className="p-3 space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                      active
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:text-white hover:bg-surface-50'
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 mt-2"
              >
                <LogOut size={18} />
                Sair
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

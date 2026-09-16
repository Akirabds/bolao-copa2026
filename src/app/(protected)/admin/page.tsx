import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import {
  Users, CreditCard, Target, Trophy, TrendingUp,
  Clock, CheckCircle, Star, AlertCircle, ChevronRight,
} from 'lucide-react'

export const metadata = { title: 'Admin — Dashboard' }

export default async function AdminPage() {
  const [totalUsers, fase1, fase2, pendingPayments, predictions, recentPayments, recentAudit] = await Promise.all([
    prisma.user.count({ where: { role: 'PARTICIPANT' } }),
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.prediction.count(),
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true } }, phase: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const [rev1agg, rev2agg, approved1, approved2] = await Promise.all([
    fase1 ? prisma.payment.aggregate({ where: { phaseId: fase1.id, status: 'APPROVED' }, _sum: { amount: true } }) : null,
    fase2 ? prisma.payment.aggregate({ where: { phaseId: fase2.id, status: 'APPROVED' }, _sum: { amount: true } }) : null,
    fase1 ? prisma.payment.count({ where: { phaseId: fase1.id, status: 'APPROVED' } }) : 0,
    fase2 ? prisma.payment.count({ where: { phaseId: fase2.id, status: 'APPROVED' } }) : 0,
  ])

  const feePercent = parseFloat(
    (await prisma.systemSetting.findUnique({ where: { key: 'platform_fee_percent' } }))?.value || '10'
  )

  const rev1 = rev1agg?._sum.amount || 0
  const rev2 = rev2agg?._sum.amount || 0
  const totalRevenue = rev1 + rev2
  const prize1 = rev1 * (1 - feePercent / 100)
  const prize2 = rev2 * (1 - feePercent / 100)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Administrativo</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral do Bolão da Copa 2026</p>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={20} className="text-brand-400" />} label="Participantes" value={totalUsers} />
        <StatCard icon={<CreditCard size={20} className="text-gold-400" />} label="Arrecadado" value={formatCurrency(totalRevenue)} />
        <StatCard icon={<Clock size={20} className="text-orange-400" />} label="Pagamentos Pendentes" value={pendingPayments} alert={pendingPayments > 0} />
        <StatCard icon={<Target size={20} className="text-blue-400" />} label="Palpites Registrados" value={predictions} />
      </div>

      {/* Fases */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* Fase 1 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-brand-400" />
              <h3 className="font-semibold text-white">Fase 1 — Grupos</h3>
            </div>
            {fase1 && <StatusBadge status={fase1.status} size="sm" />}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{approved1}</p>
              <p className="text-xs text-slate-500">Inscritos</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-brand-400">{formatCurrency(rev1)}</p>
              <p className="text-xs text-slate-500">Arrecadado</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gold-400">{formatCurrency(prize1)}</p>
              <p className="text-xs text-slate-500">Prêmio liq.</p>
            </div>
          </div>
          <Link href="/admin/fases" className="btn-secondary w-full btn-sm">
            Gerenciar fase <ChevronRight size={14} />
          </Link>
        </div>

        {/* Fase 2 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-gold-400" />
              <h3 className="font-semibold text-white">Fase 2 — Mata-Mata</h3>
            </div>
            {fase2 && <StatusBadge status={fase2.status} size="sm" />}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{approved2}</p>
              <p className="text-xs text-slate-500">Inscritos</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gold-400">{formatCurrency(rev2)}</p>
              <p className="text-xs text-slate-500">Arrecadado</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gold-400">{formatCurrency(prize2)}</p>
              <p className="text-xs text-slate-500">Prêmio liq.</p>
            </div>
          </div>
          <Link href="/admin/fases" className="btn-secondary w-full btn-sm">
            Gerenciar fase <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard, badge: pendingPayments > 0 ? pendingPayments : undefined, color: 'text-brand-400' },
          { href: '/admin/resultados', label: 'Resultados', icon: Trophy, color: 'text-gold-400' },
          { href: '/admin/partidas', label: 'Partidas', icon: Target, color: 'text-blue-400' },
          { href: '/admin/usuarios', label: 'Usuários', icon: Users, color: 'text-purple-400' },
          { href: '/admin/premiacao', label: 'Premiação', icon: TrendingUp, color: 'text-orange-400' },
        ].map(({ href, label, icon: Icon, badge, color }) => (
          <Link key={href} href={href} className="card p-4 flex flex-col items-center gap-2 text-center hover:border-surface-50 transition-colors group">
            <div className="relative">
              <Icon size={22} className={color} />
              {badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      {/* Pagamentos pendentes */}
      {recentPayments.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-400" />
              <h3 className="font-semibold text-white">Pagamentos Pendentes</h3>
            </div>
            <Link href="/admin/pagamentos" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl text-sm">
                <div>
                  <p className="font-medium text-white">{p.user.name}</p>
                  <p className="text-xs text-slate-500">{p.phase.name} · {formatCurrency(p.amount)}</p>
                </div>
                <Link href="/admin/pagamentos" className="btn-primary btn-sm">
                  Confirmar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auditoria recente */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Atividade Recente</h3>
          <Link href="/admin/auditoria" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-2">
          {recentAudit.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-slate-300">{log.userName || 'Sistema'}</span>
                <span className="text-slate-500"> · {log.action.replace(/_/g, ' ')} </span>
                <span className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string | number; alert?: boolean }) {
  return (
    <div className={`card p-4 ${alert ? 'border-orange-500/40' : ''}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className={`text-2xl font-bold ${alert ? 'text-orange-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

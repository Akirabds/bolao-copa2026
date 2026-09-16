import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, getPhaseStatusLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { PhaseStatusManager } from './PhaseStatusManager'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Admin — Fases' }

const VALID_TRANSITIONS: Record<string, string[]> = {
  PRE_REGISTRATION: ['OPEN_FOR_PAYMENT'],
  OPEN_FOR_PAYMENT: ['OPEN_FOR_PREDICTIONS', 'PRE_REGISTRATION'],
  OPEN_FOR_PREDICTIONS: ['CLOSED'],
  CLOSED: ['SETTLED'],
  SETTLED: ['PRIZED'],
  PRIZED: [],
}

export default async function AdminFasesPage() {
  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const [stats1, stats2] = await Promise.all([
    fase1 ? getPhaseStats(fase1.id) : null,
    fase2 ? getPhaseStats(fase2.id) : null,
  ])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck size={22} className="text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Fases</h1>
          <p className="text-slate-400 text-sm">Controle o ciclo de vida de cada fase do bolão</p>
        </div>
      </div>

      <div className="space-y-6">
        {[
          { phase: fase1, stats: stats1, slug: 'fase1', label: 'Fase 1 — Grupos', color: 'brand' },
          { phase: fase2, stats: stats2, slug: 'fase2', label: 'Fase 2 — Mata-Mata', color: 'gold' },
        ].map(({ phase, stats, slug, label, color }) => {
          if (!phase) return null
          const nextStatuses = VALID_TRANSITIONS[phase.status] || []

          return (
            <div key={slug} className={`card p-6 ${color === 'gold' ? 'border-gold-500/20' : 'border-brand-600/20'}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">{label}</h2>
                  <p className="text-sm text-slate-400">{formatCurrency(phase.entryFee)} por participante</p>
                </div>
                <StatusBadge status={phase.status} />
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <Stat label="Inscritos" value={stats.approved} />
                  <Stat label="Arrecadado" value={formatCurrency(stats.revenue)} />
                  <Stat label="Palpites" value={stats.predictions} />
                </div>
              )}

              {/* Datas */}
              <div className="space-y-1 mb-5 text-xs text-slate-500">
                {phase.openedAt && <p>Aberta em: {formatDate(phase.openedAt)}</p>}
                {phase.closedAt && <p>Encerrada em: {formatDate(phase.closedAt)}</p>}
                {phase.settledAt && <p>Apurada em: {formatDate(phase.settledAt)}</p>}
              </div>

              {/* Aviso Fase 2 */}
              {slug === 'fase2' && (
                <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 mb-5 text-xs text-gold-300">
                  ⚠️ Encerrar a Fase 1 libera automaticamente o acesso aos participantes que pagaram a Fase 2.
                </div>
              )}

              {/* Ações de transição */}
              {nextStatuses.length > 0 && (
                <PhaseStatusManager phaseSlug={slug} nextStatuses={nextStatuses} currentStatus={phase.status} />
              )}

              {nextStatuses.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">Fase finalizada</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

async function getPhaseStats(phaseId: string) {
  const [approved, revagg, predictions] = await Promise.all([
    prisma.payment.count({ where: { phaseId, status: 'APPROVED' } }),
    prisma.payment.aggregate({ where: { phaseId, status: 'APPROVED' }, _sum: { amount: true } }),
    prisma.prediction.count({ where: { phaseId } }),
  ])
  return { approved, revenue: revagg._sum.amount || 0, predictions }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { ProgressBar } from '@/components/ProgressBar'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Target, Star, ChevronRight, AlertCircle,
  Clock, TrendingUp,
} from 'lucide-react'
import { PaymentSection } from './PaymentSection'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const userId = session.userId

  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const [p1Access, p2Access, p2Payment, p1Ranking, p2Ranking] = await Promise.all([
    fase1 ? prisma.phaseAccess.findUnique({ where: { userId_phaseId: { userId, phaseId: fase1.id } } }) : null,
    fase2 ? prisma.phaseAccess.findUnique({ where: { userId_phaseId: { userId, phaseId: fase2.id } } }) : null,
    fase2 ? prisma.payment.findFirst({ where: { userId, phaseId: fase2.id }, orderBy: { createdAt: 'desc' } }) : null,
    fase1 ? prisma.ranking.findUnique({ where: { userId_phaseId: { userId, phaseId: fase1.id } } }) : null,
    fase2 ? prisma.ranking.findUnique({ where: { userId_phaseId: { userId, phaseId: fase2.id } } }) : null,
  ])

  const now = new Date()

  // Progress fase 1
  const [p1Total, p1Filled, p1Locked] = fase1 ? await Promise.all([
    prisma.match.count({ where: { phaseId: fase1.id } }),
    prisma.prediction.count({ where: { userId, phaseId: fase1.id } }),
    prisma.match.count({ where: { phaseId: fase1.id, OR: [{ kickoffAt: { lte: now } }, { predictionDeadlineAt: { lte: now } }] } }),
  ]) : [0, 0, 0]

  // Progress fase 2
  const [p2Total, p2Filled, p2Locked] = fase2 ? await Promise.all([
    prisma.match.count({ where: { phaseId: fase2.id } }),
    prisma.prediction.count({ where: { userId, phaseId: fase2.id } }),
    prisma.match.count({ where: { phaseId: fase2.id, OR: [{ kickoffAt: { lte: now } }, { predictionDeadlineAt: { lte: now } }] } }),
  ]) : [0, 0, 0]

  // Posição no ranking
  let p1Position: number | null = null
  if (p1Ranking) {
    const above = await prisma.ranking.count({
      where: { phaseId: fase1!.id, totalPoints: { gt: p1Ranking.totalPoints } },
    })
    p1Position = above + 1
  }

  const p1HasAccess = p1Access?.status === 'ACCESS_GRANTED'
  const p2HasAccess = p2Access?.status === 'ACCESS_GRANTED'
  const p2Waiting = p2Access?.status === 'AWAITING_PHASE_RELEASE'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {session.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400 mt-1">Acompanhe sua participação no Bolão da Copa 2026</p>
      </div>

      {/* Cards das fases */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* Fase 1 */}
        <PhaseCard
          phase={fase1}
          access={p1Access}
          payment={null}
          ranking={p1Ranking}
          position={p1Position}
          progress={{ total: p1Total, filled: p1Filled, locked: p1Locked }}
          hasAccess={p1HasAccess}
          phaseSlug="fase1"
          phaseName="Fase 1 — Grupos"
          icon={<Target size={20} className="text-brand-400" />}
          color="brand"
          linkHref="/fase/fase1"
        />

        {/* Fase 2 */}
        <PhaseCard
          phase={fase2}
          access={p2Access}
          payment={p2Payment}
          ranking={p2Ranking}
          position={null}
          progress={{ total: p2Total, filled: p2Filled, locked: p2Locked }}
          hasAccess={p2HasAccess}
          waiting={p2Waiting}
          phaseSlug="fase2"
          phaseName="Fase 2 — Mata-Mata"
          icon={<Star size={20} className="text-gold-400" />}
          color="gold"
          linkHref="/fase/fase2"
        />
      </div>

      {/* Seção de pagamento (Client Component) */}
      <PaymentSection
        fase1={{ phase: fase1, access: p1Access, payment: null }}
        fase2={{ phase: fase2, access: p2Access, payment: p2Payment }}
      />

      {/* Ranking preview */}
      {p1HasAccess && p1Ranking && (
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" />
              <h3 className="font-semibold text-white">Sua posição</h3>
            </div>
            <Link href="/ranking" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Ver ranking <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gold-400">{p1Position ? `${p1Position}º` : '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Posição</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-white">{p1Ranking.totalPoints}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pontos</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-brand-400">{p1Ranking.exactScores}</p>
              <p className="text-xs text-slate-500 mt-0.5">Exatos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PhaseCardProps {
  phase: any
  access: any
  payment: any
  ranking: any
  position: number | null
  progress: { total: number; filled: number; locked: number }
  hasAccess: boolean
  waiting?: boolean
  phaseSlug: string
  phaseName: string
  icon: React.ReactNode
  color: 'brand' | 'gold'
  linkHref: string
}

function PhaseCard({ phase, access, payment, ranking, progress, hasAccess, waiting, phaseSlug, phaseName, icon, color, linkHref }: PhaseCardProps) {
  const accent = color === 'gold' ? 'border-gold-500/30' : 'border-brand-600/30'
  const btnClass = color === 'gold' ? 'btn-gold' : 'btn-primary'

  return (
    <div className={`card p-5 ${hasAccess || waiting ? accent : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-white text-sm">{phaseName}</span>
        </div>
        {access && <StatusBadge status={access.status} size="sm" />}
      </div>

      {/* Pontuação se tiver acesso */}
      {hasAccess && ranking && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-white">{ranking.totalPoints}</p>
            <p className="text-xs text-slate-500">Pontos</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-white">{ranking.exactScores}</p>
            <p className="text-xs text-slate-500">Placares exatos</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {hasAccess && progress.total > 0 && (
        <ProgressBar
          total={progress.total}
          filled={progress.filled}
          locked={progress.locked}
          label="Palpites"
          className="mb-4"
        />
      )}

      {/* Status messages */}
      {!access && phase && phaseSlug === 'fase2' && (
        <div className="flex items-start gap-2 p-3 bg-surface-50 rounded-lg mb-4 text-sm text-slate-400">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>Faça o pagamento da Fase 2 para garantir sua participação no mata-mata.</span>
        </div>
      )}

      {waiting && (
        <div className="flex items-start gap-2 p-3 bg-gold-500/10 border border-gold-500/20 rounded-lg mb-4 text-sm text-gold-300">
          <Clock size={15} className="flex-shrink-0 mt-0.5" />
          <span>Pagamento aprovado. Aguardando encerramento da Fase 1 para liberar os palpites.</span>
        </div>
      )}

      {payment?.status === 'PENDING' && (
        <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-4 text-sm text-orange-300">
          <Clock size={15} className="flex-shrink-0 mt-0.5" />
          <span>Pagamento aguardando confirmação do administrador.</span>
        </div>
      )}

      {/* Action */}
      {hasAccess && (
        <Link href={linkHref} className={`btn ${btnClass} w-full`}>
          <Target size={16} />
          {progress.filled > 0 ? 'Ver / editar palpites' : 'Fazer palpites'}
          <ChevronRight size={16} />
        </Link>
      )}

      {phase && !access && !payment && phaseSlug === 'fase2' && (
        <p className="text-xs text-slate-500 text-center">
          {formatCurrency(phase.entryFee)} para participar
        </p>
      )}
    </div>
  )
}

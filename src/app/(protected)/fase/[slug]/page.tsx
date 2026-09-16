import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MatchesClient } from './MatchesClient'
import { Lock, Clock, AlertCircle, Star, Target, Trophy, Zap, CheckCircle2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const phase = await prisma.phase.findUnique({ where: { slug: params.slug } })
  return { title: phase?.name || 'Fase' }
}

export default async function FasePage({ params }: { params: { slug: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (!['fase1', 'fase2'].includes(params.slug)) notFound()

  const phase = await prisma.phase.findUnique({ where: { slug: params.slug } })
  if (!phase) notFound()

  const userId = session.userId

  const [access, matches, predictions, ranking] = await Promise.all([
    prisma.phaseAccess.findUnique({
      where: { userId_phaseId: { userId, phaseId: phase.id } },
    }),
    prisma.match.findMany({
      where: { phaseId: phase.id },
      orderBy: [{ sortOrder: 'asc' }, { kickoffAt: 'asc' }],
    }),
    prisma.prediction.findMany({
      where: { userId, phaseId: phase.id },
    }),
    prisma.ranking.findUnique({
      where: { userId_phaseId: { userId, phaseId: phase.id } },
    }),
  ])

  // Verificar acesso
  const hasAccess = access?.status === 'ACCESS_GRANTED'
  const waiting = access?.status === 'AWAITING_PHASE_RELEASE'

  // Motivo de bloqueio
  if (!hasAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {params.slug === 'fase2' ? <Star size={16} className="text-gold-400" /> : <Target size={16} className="text-brand-400" />}
            <span>{phase.name}</span>
          </div>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-surface-50 border border-[#2a3147] rounded-full flex items-center justify-center mx-auto mb-4">
            {waiting ? <Clock size={28} className="text-gold-400" /> : <Lock size={28} className="text-slate-500" />}
          </div>

          {waiting ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Pagamento aprovado!</h2>
              <p className="text-slate-400 mb-4">
                Aguardando encerramento da Fase 1 para liberar os palpites do mata-mata.
              </p>
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 text-sm text-gold-300 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <p>Seus palpites da Fase 2 serão liberados automaticamente quando a Fase 1 for encerrada oficialmente pelo administrador.</p>
                </div>
              </div>
            </>
          ) : access?.status === 'PENDING' ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Pagamento em análise</h2>
              <p className="text-slate-400">Seu pagamento está sendo verificado. Em breve o acesso será liberado.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Sem acesso</h2>
              <p className="text-slate-400 mb-4">
                {params.slug === 'fase2'
                  ? 'Faça o pagamento da Fase 2 para garantir sua vaga no mata-mata.'
                  : 'Acesso não encontrado. Tente sair e entrar novamente.'}
              </p>
              <a href="/dashboard" className="btn-primary">Ir para o Dashboard</a>
            </>
          )}
        </div>
      </div>
    )
  }

  const predMap = Object.fromEntries(predictions.map(p => [p.matchId, p]))

  const now = new Date()
  const matchesWithStatus = matches.map(m => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
    predictionDeadlineAt: m.predictionDeadlineAt?.toISOString() || null,
    resultConfirmedAt: m.resultConfirmedAt?.toISOString() || null,
    prediction: predMap[m.id] ? {
      ...predMap[m.id],
      submittedAt: predMap[m.id].submittedAt.toISOString(),
      updatedAt: predMap[m.id].updatedAt.toISOString(),
    } : null,
    isLocked: now >= new Date(m.predictionDeadlineAt || m.kickoffAt),
  }))

  // Grupos para fase 1
  const groups = params.slug === 'fase1'
    ? Array.from(new Set(matches.filter(m => m.groupCode).map(m => m.groupCode!)))
    : []

  const scoredCount = predictions.filter(p => p.status === 'SCORED').length
  const hasPoints = ranking && (ranking.totalPoints > 0 || scoredCount > 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{phase.name}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {predictions.length} de {matches.length} palpites registrados
        </p>
      </div>

      {/* Resumo de pontos */}
      {hasPoints && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Trophy size={14} className="text-gold-400" />
              <span className="text-xs text-slate-400">Pontos</span>
            </div>
            <p className="text-2xl font-bold text-white">{ranking?.totalPoints ?? 0}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap size={14} className="text-gold-400" />
              <span className="text-xs text-slate-400">Placar exato</span>
            </div>
            <p className="text-2xl font-bold text-white">{ranking?.exactScores ?? 0}</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 size={14} className="text-brand-400" />
              <span className="text-xs text-slate-400">Resultado certo</span>
            </div>
            <p className="text-2xl font-bold text-white">{ranking?.outcomeHits ?? 0}</p>
          </div>
        </div>
      )}

      <MatchesClient
        matches={matchesWithStatus}
        phaseId={phase.id}
        phaseSlug={params.slug}
        groups={groups}
        phaseStatus={phase.status}
      />
    </div>
  )
}

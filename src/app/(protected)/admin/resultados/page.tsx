import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { ResultForm } from './ResultForm'
import { Trophy, CheckCircle } from 'lucide-react'

export const metadata = { title: 'Admin — Resultados' }

export default async function AdminResultadosPage() {
  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const matches = await prisma.match.findMany({
    where: {
      phaseId: { in: [fase1?.id, fase2?.id].filter(Boolean) as string[] },
      matchStatus: { not: 'CANCELLED' },
    },
    include: {
      _count: { select: { predictions: true } },
      resultLogs: { orderBy: { confirmedAt: 'desc' }, take: 1 },
    },
    orderBy: [{ kickoffAt: 'asc' }],
  })

  const pending = matches.filter(m => m.matchStatus !== 'FINISHED')
  const finished = matches.filter(m => m.matchStatus === 'FINISHED')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Trophy size={22} className="text-gold-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Lançar Resultados</h1>
          <p className="text-slate-400 text-sm">Registre os placares oficiais para calcular pontuações</p>
        </div>
      </div>

      {/* Partidas sem resultado */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-5 bg-blue-500 rounded-full" />
            Aguardando resultado ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(m => (
              <MatchResultCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* Partidas com resultado */}
      {finished.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-brand-400" />
            Resultados lançados ({finished.length})
          </h2>
          <div className="space-y-3">
            {finished.map(m => (
              <div key={m.id} className="card p-4 border-brand-600/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                      <span>{m.flag1} {m.selection1}</span>
                      <span className="font-bold text-brand-400 text-base">{m.officialScore1} × {m.officialScore2}</span>
                      <span>{m.selection2} {m.flag2}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{m.groupCode ? `Grupo ${m.groupCode}` : m.roundLabel}</span>
                      <span>·</span>
                      <span>{formatDate(m.kickoffAt, 'dd/MM HH:mm')}</span>
                      <span>·</span>
                      <span>{m._count.predictions} palpites pontuados</span>
                    </div>
                  </div>
                  <ResultForm matchId={m.id} existing={{ score1: m.officialScore1 ?? 0, score2: m.officialScore2 ?? 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-slate-400">Nenhuma partida cadastrada</p>
        </div>
      )}
    </div>
  )
}

function MatchResultCard({ match }: { match: any }) {
  const isPast = new Date(match.kickoffAt) < new Date()
  return (
    <div className={`card p-4 ${isPast ? 'border-orange-500/30' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
            <span>{match.flag1} {match.selection1}</span>
            <span className="text-slate-500">×</span>
            <span>{match.selection2} {match.flag2}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{match.groupCode ? `Grupo ${match.groupCode}` : match.roundLabel}</span>
            <span>·</span>
            <span>{formatDate(match.kickoffAt, 'dd/MM HH:mm')}</span>
            <span>·</span>
            <span>{match._count.predictions} palpites</span>
          </div>
        </div>
        <ResultForm matchId={match.id} />
      </div>
    </div>
  )
}

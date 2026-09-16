import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { KickoffEditor } from '@/components/KickoffEditor'
import { Target } from 'lucide-react'

export const metadata = { title: 'Admin — Partidas' }

export default async function AdminPartidasPage() {
  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const matches = await prisma.match.findMany({
    where: { phaseId: { in: [fase1?.id, fase2?.id].filter(Boolean) as string[] } },
    include: { _count: { select: { predictions: true } }, phase: { select: { name: true, slug: true } } },
    orderBy: [{ phase: { slug: 'asc' } }, { sortOrder: 'asc' }, { kickoffAt: 'asc' }],
  })

  const fase1Matches = matches.filter(m => m.phase.slug === 'fase1')
  const fase2Matches = matches.filter(m => m.phase.slug === 'fase2')

  // Agrupar Fase 1 por grupo
  const byGroup: Record<string, typeof fase1Matches> = {}
  for (const m of fase1Matches) {
    const key = m.groupCode || 'Sem grupo'
    byGroup[key] = [...(byGroup[key] || []), m]
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Target size={22} className="text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Partidas</h1>
          <p className="text-slate-400 text-sm">{matches.length} partidas cadastradas</p>
        </div>
      </div>

      {/* Fase 1 — por grupo */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-2 h-5 bg-brand-500 rounded-full" />
          Fase 1 — Grupos ({fase1Matches.length} partidas)
        </h2>
        <div className="space-y-6">
          {Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([group, groupMatches]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Grupo {group}</h3>
              <div className="card overflow-hidden">
                <div className="divide-y divide-surface-border">
                  {groupMatches.map(m => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fase 2 — mata-mata */}
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-2 h-5 bg-gold-500 rounded-full" />
          Fase 2 — Mata-Mata ({fase2Matches.length} partidas)
        </h2>
        <div className="card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {fase2Matches.map(m => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium text-white">
          <span>{match.flag1} {match.selection1}</span>
          <span className="text-slate-500">×</span>
          <span>{match.selection2} {match.flag2}</span>
          {match.officialScore1 !== null && (
            <span className="text-brand-400 font-bold ml-2">
              ({match.officialScore1}×{match.officialScore2})
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-0.5">
            {formatDate(match.kickoffAt, 'dd/MM HH:mm')}
            <KickoffEditor matchId={match.id} kickoffAt={match.kickoffAt.toISOString()} />
          </span>
          {match.location && <><span>·</span><span>{match.location}</span></>}
          <span>·</span>
          <span>{match._count.predictions} palpites</span>
        </div>
      </div>
      <StatusBadge status={match.matchStatus} size="sm" />
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MatchCard } from '@/components/MatchCard'
import { ProgressBar } from '@/components/ProgressBar'
import { cn } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { Filter, List, Calendar } from 'lucide-react'

interface Match {
  id: string
  groupCode?: string | null
  roundLabel?: string | null
  matchday?: number | null
  selection1: string
  selection2: string
  flag1?: string | null
  flag2?: string | null
  kickoffAt: string
  location?: string | null
  stadium?: string | null
  matchStatus: string
  officialScore1?: number | null
  officialScore2?: number | null
  predictionDeadlineAt?: string | null
  prediction?: any
  isLocked: boolean
}

interface Props {
  matches: Match[]
  phaseId: string
  phaseSlug: string
  groups: string[]
  phaseStatus: string
}

export function MatchesClient({ matches, phaseId, phaseSlug, groups, phaseStatus }: Props) {
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'group' | 'date'>('group')

  const totalFilled = matches.filter(m => m.prediction).length
  const totalLocked = matches.filter(m => m.isLocked).length

  const filtered = useMemo(() => {
    if (!activeGroup) return matches
    return matches.filter(m => m.groupCode === activeGroup)
  }, [matches, activeGroup])

  // Agrupar por grupo ou por data
  const grouped = useMemo(() => {
    if (phaseSlug === 'fase2') {
      const byRound: Record<string, Match[]> = {}
      for (const m of filtered) {
        const key = m.roundLabel || 'Mata-Mata'
        byRound[key] = [...(byRound[key] || []), m]
      }
      return byRound
    }

    if (viewMode === 'date') {
      const byDate: Record<string, Match[]> = {}
      for (const m of filtered) {
        const key = formatInTimeZone(new Date(m.kickoffAt), 'America/Sao_Paulo', "EEEE, dd 'de' MMMM", { locale: ptBR })
        byDate[key] = [...(byDate[key] || []), m]
      }
      return byDate
    }

    const byGroup: Record<string, Match[]> = {}
    for (const m of filtered) {
      const key = m.groupCode ? `Grupo ${m.groupCode}` : 'Mata-Mata'
      byGroup[key] = [...(byGroup[key] || []), m]
    }
    return byGroup
  }, [filtered, viewMode, phaseSlug])

  return (
    <div>
      {/* Barra de progresso */}
      <div className="card p-4 mb-6">
        <ProgressBar
          total={matches.length}
          filled={totalFilled}
          locked={totalLocked}
          label="Progresso dos palpites"
        />
      </div>

      {/* Filtros */}
      {phaseSlug === 'fase1' && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Filtro por grupo */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGroup(null)}
              className={cn('btn btn-sm', activeGroup === null ? 'btn-primary' : 'btn-secondary')}
            >
              Todos
            </button>
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={cn('btn btn-sm', activeGroup === g ? 'btn-primary' : 'btn-secondary')}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Toggle view */}
          <div className="ml-auto flex items-center gap-1 bg-surface-50 rounded-lg p-0.5 border border-[#2a3147]">
            <button
              onClick={() => setViewMode('group')}
              className={cn('btn btn-sm gap-1', viewMode === 'group' ? 'btn-primary' : 'btn-ghost text-slate-400')}
            >
              <Filter size={13} />
              Grupo
            </button>
            <button
              onClick={() => setViewMode('date')}
              className={cn('btn btn-sm gap-1', viewMode === 'date' ? 'btn-primary' : 'btn-ghost text-slate-400')}
            >
              <Calendar size={13} />
              Data
            </button>
          </div>
        </div>
      )}

      {/* Partidas agrupadas */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([groupLabel, groupMatches]) => (
          <div key={groupLabel}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-semibold text-white">{groupLabel}</h3>
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-slate-500">
                {groupMatches.filter(m => m.prediction).length}/{groupMatches.length}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {groupMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={match.prediction}
                  phaseId={phaseId}
                  canPredict={phaseStatus === 'OPEN_FOR_PREDICTIONS'}
                  onSaved={() => router.refresh()}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-slate-400">Nenhuma partida encontrada</p>
        </div>
      )}
    </div>
  )
}

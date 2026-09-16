import { cn, ordinal } from '@/lib/utils'
import { Trophy, Medal, Award } from 'lucide-react'

interface RankingEntry {
  position: number
  userId: string
  totalPoints: number
  exactScores: number
  outcomeHits: number
  user: { id: string; name: string }
}

interface RankingTableProps {
  rankings: RankingEntry[]
  currentUserId?: string
  phaseName?: string
}

const medals = [
  { icon: Trophy, color: 'text-gold-400', bg: 'bg-gold-500/20 border-gold-500/40' },
  { icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-500/30' },
  { icon: Award, color: 'text-amber-700', bg: 'bg-amber-900/20 border-amber-700/30' },
]

export function RankingTable({ rankings, currentUserId, phaseName }: RankingTableProps) {
  if (rankings.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Trophy size={40} className="mx-auto text-slate-600 mb-3" />
        <p className="text-slate-400">Ranking ainda não disponível</p>
        <p className="text-slate-500 text-sm mt-1">Aguarde o início dos jogos</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-[#2a3147] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-gold-400" />
          <h3 className="font-semibold text-white">{phaseName || 'Ranking'}</h3>
        </div>
        <span className="text-sm text-slate-500">{rankings.length} participantes</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-[#2a3147]">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5">Participante</div>
        <div className="col-span-2 text-center">Pts</div>
        <div className="col-span-2 text-center hidden sm:block">Exatos</div>
        <div className="col-span-2 text-center hidden sm:block">Acertos</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-border">
        {rankings.map((entry) => {
          const isMe = entry.userId === currentUserId
          const medal = medals[entry.position - 1]
          const isTop3 = entry.position <= 3

          return (
            <div
              key={entry.userId}
              className={cn(
                'grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors',
                isMe ? 'bg-brand-600/10 border-l-2 border-brand-500' : 'hover:bg-surface-50/50',
                isTop3 && !isMe ? 'bg-gold-500/5' : ''
              )}
            >
              {/* Posição */}
              <div className="col-span-1 flex justify-center">
                {isTop3 ? (
                  <div className={cn('w-7 h-7 rounded-full border flex items-center justify-center', medal.bg)}>
                    <medal.icon size={14} className={medal.color} />
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 font-mono w-7 text-center">{entry.position}º</span>
                )}
              </div>

              {/* Nome */}
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    isTop3 ? 'bg-gold-500/20 text-gold-400' : 'bg-surface-50 text-slate-400'
                  )}>
                    {entry.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', isMe ? 'text-brand-400' : 'text-slate-200')}>
                      {entry.user.name}
                      {isMe && <span className="ml-1.5 text-xs text-brand-500">(você)</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pontos */}
              <div className="col-span-2 text-center">
                <span className={cn(
                  'font-bold text-base',
                  isTop3 ? 'text-gold-400' : isMe ? 'text-brand-400' : 'text-white'
                )}>
                  {entry.totalPoints}
                </span>
              </div>

              {/* Placares exatos */}
              <div className="col-span-2 text-center hidden sm:block">
                <span className="text-sm text-slate-300">{entry.exactScores}</span>
              </div>

              {/* Acertos de resultado */}
              <div className="col-span-2 text-center hidden sm:block">
                <span className="text-sm text-slate-400">{entry.outcomeHits}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

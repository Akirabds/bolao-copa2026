import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RankingTable } from '@/components/RankingTable'
import { Trophy } from 'lucide-react'

export const metadata = { title: 'Ranking' }

export default async function RankingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const [r1, r2] = await Promise.all([
    fase1 ? prisma.ranking.findMany({
      where: { phaseId: fase1.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ totalPoints: 'desc' }, { exactScores: 'desc' }, { outcomeHits: 'desc' }, { lastPredictionAt: 'asc' }],
    }) : [],
    fase2 ? prisma.ranking.findMany({
      where: { phaseId: fase2.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ totalPoints: 'desc' }, { exactScores: 'desc' }, { outcomeHits: 'desc' }, { lastPredictionAt: 'asc' }],
    }) : [],
  ])

  const rank1 = r1.map((r, i) => ({ ...r, position: i + 1 }))
  const rank2 = r2.map((r, i) => ({ ...r, position: i + 1 }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={22} className="text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Ranking</h1>
        </div>
        <p className="text-slate-400 text-sm">Classificação geral do Bolão da Copa 2026</p>
      </div>

      <div className="space-y-8">
        {/* Fase 1 */}
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-5 bg-brand-500 rounded-full" />
            Fase 1 — Grupos
          </h2>
          <RankingTable
            rankings={rank1}
            currentUserId={session.userId}
            phaseName="Ranking da Fase 1"
          />
        </div>

        {/* Fase 2 */}
        {rank2.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-5 bg-gold-500 rounded-full" />
              Fase 2 — Mata-Mata
            </h2>
            <RankingTable
              rankings={rank2}
              currentUserId={session.userId}
              phaseName="Ranking da Fase 2"
            />
          </div>
        )}
      </div>

      {/* Sistema de pontuação */}
      <div className="card p-5 mt-8">
        <h3 className="font-semibold text-white mb-4">Sistema de Pontuação</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Placar Exato</p>
              <p className="text-xs text-slate-400 mt-0.5">Acertou o resultado e o placar exato</p>
            </div>
            <span className="text-xl font-bold text-green-400">+30</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Resultado Correto</p>
              <p className="text-xs text-slate-400 mt-0.5">Acertou vencedor ou empate, mas não o placar</p>
            </div>
            <span className="text-xl font-bold text-brand-400">+15</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Palpite Errado</p>
              <p className="text-xs text-slate-400 mt-0.5">Errou o resultado</p>
            </div>
            <span className="text-xl font-bold text-slate-500">0</span>
          </div>
        </div>
      </div>

      {/* Critérios de desempate */}
      <div className="card p-5 mt-4">
        <h3 className="font-semibold text-white mb-4">Critérios de Desempate</h3>
        <ol className="space-y-2 text-sm text-slate-400">
          {['Maior pontuação total', 'Maior número de placares exatos (30 pts)', 'Maior número de acertos de resultado', 'Data mais antiga do último palpite válido'].map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 bg-surface-50 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">{i + 1}</span>
              {c}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

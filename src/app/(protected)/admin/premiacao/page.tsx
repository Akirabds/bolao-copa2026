import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export const metadata = { title: 'Admin — Premiação' }

export default async function AdminPremiacaoPage() {
  const [fase1, fase2] = await Promise.all([
    prisma.phase.findUnique({ where: { slug: 'fase1' } }),
    prisma.phase.findUnique({ where: { slug: 'fase2' } }),
  ])

  const feePercent = parseFloat(
    (await prisma.systemSetting.findUnique({ where: { key: 'platform_fee_percent' } }))?.value || '10'
  )

  const getPhaseData = async (phase: any) => {
    if (!phase) return null
    const [prizes, rev, rankings] = await Promise.all([
      prisma.prize.findMany({ where: { phaseId: phase.id }, orderBy: { position: 'asc' } }),
      prisma.payment.aggregate({ where: { phaseId: phase.id, status: 'APPROVED' }, _sum: { amount: true } }),
      prisma.ranking.findMany({
        where: { phaseId: phase.id },
        include: { user: { select: { name: true } } },
        orderBy: [{ totalPoints: 'desc' }, { exactScores: 'desc' }],
        take: 3,
      }),
    ])
    const revenue = rev._sum.amount || 0
    const fee = revenue * (feePercent / 100)
    const net = revenue - fee
    return { prizes, revenue, fee, net, rankings }
  }

  const [data1, data2] = await Promise.all([getPhaseData(fase1), getPhaseData(fase2)])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Trophy size={22} className="text-gold-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Premiação</h1>
          <p className="text-slate-400 text-sm">Configuração e apuração dos prêmios por fase</p>
        </div>
      </div>

      <div className="space-y-8">
        {[
          { phase: fase1, data: data1, label: 'Fase 1 — Grupos', border: 'border-brand-600/20' },
          { phase: fase2, data: data2, label: 'Fase 2 — Mata-Mata', border: 'border-gold-500/20' },
        ].map(({ phase, data, label, border }) => {
          if (!phase || !data) return null
          return (
            <div key={phase.id} className={`card p-6 ${border}`}>
              <h2 className="text-lg font-bold text-white mb-5">{label}</h2>

              {/* Resumo financeiro */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{formatCurrency(data.revenue)}</p>
                  <p className="text-xs text-slate-500">Total arrecadado</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-red-400">-{formatCurrency(data.fee)}</p>
                  <p className="text-xs text-slate-500">Taxa ({feePercent}%)</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gold-400">{formatCurrency(data.net)}</p>
                  <p className="text-xs text-slate-500">Prêmio líquido</p>
                </div>
              </div>

              {/* Distribuição */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Distribuição do prêmio</h3>
                <div className="space-y-2">
                  {data.prizes.map((p, i) => {
                    const amount = p.percentage ? data.net * (p.percentage / 100) : (p.fixedAmount || 0)
                    const winner = data.rankings[i]
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'}`}>
                            {i + 1}º
                          </span>
                          <div>
                            <p className="font-medium text-white">
                              {winner ? winner.user.name : '—'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.percentage ? `${p.percentage}%` : 'Valor fixo'}
                              {winner && ` · ${winner.totalPoints} pts`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gold-400">{formatCurrency(amount)}</p>
                          <p className="text-xs text-slate-500">{p.status}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top 3 ranking atual */}
              {data.rankings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">Classificação atual</h3>
                  <div className="space-y-2">
                    {data.rankings.slice(0, 3).map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{i + 1}. {r.user.name}</span>
                        <span className="font-bold text-white">{r.totalPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

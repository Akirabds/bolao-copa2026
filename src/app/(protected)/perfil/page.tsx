import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency, getPaymentStatusLabel, getPhaseAccessLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { User, CreditCard, Target, Calendar } from 'lucide-react'

export const metadata = { title: 'Meu Perfil' }

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phone: true, cpf: true, createdAt: true },
  })

  const payments = await prisma.payment.findMany({
    where: { userId: session.userId },
    include: { phase: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.userId, status: 'SCORED' },
    include: { match: { select: { selection1: true, selection2: true, kickoffAt: true, officialScore1: true, officialScore2: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  const access = await prisma.phaseAccess.findMany({
    where: { userId: session.userId },
    include: { phase: { select: { name: true, slug: true } } },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-slate-400 text-sm mt-1">Seus dados e histórico de participação</p>
      </div>

      <div className="space-y-6">
        {/* Dados pessoais */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-brand-400" />
            <h2 className="font-semibold text-white">Dados Pessoais</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Nome', value: user?.name },
              { label: 'E-mail', value: user?.email },
              { label: 'Telefone', value: user?.phone || '—' },
              { label: 'CPF', value: user?.cpf || '—' },
              { label: 'Membro desde', value: user?.createdAt ? formatDate(user.createdAt, 'dd/MM/yyyy') : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status de participação */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target size={18} className="text-brand-400" />
            <h2 className="font-semibold text-white">Participação por Fase</h2>
          </div>
          {access.length === 0 ? (
            <p className="text-slate-400 text-sm">Você ainda não está inscrito em nenhuma fase.</p>
          ) : (
            <div className="space-y-3">
              {access.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{a.phase.name}</p>
                    {a.grantedAt && <p className="text-xs text-slate-500">Liberado em {formatDate(a.grantedAt, 'dd/MM/yyyy')}</p>}
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagamentos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard size={18} className="text-brand-400" />
            <h2 className="font-semibold text-white">Histórico de Pagamentos</h2>
          </div>
          {payments.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{p.phase.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCurrency(p.amount)}</p>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Palpites recentes */}
        {predictions.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={18} className="text-brand-400" />
              <h2 className="font-semibold text-white">Palpites Apurados Recentes</h2>
            </div>
            <div className="space-y-3">
              {predictions.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl text-sm">
                  <div>
                    <p className="font-medium text-white">
                      {p.match.selection1} × {p.match.selection2}
                    </p>
                    <p className="text-xs text-slate-500">
                      Resultado: {p.match.officialScore1} × {p.match.officialScore2} · Palpite: {p.predictedScore1} × {p.predictedScore2}
                    </p>
                  </div>
                  <div className={`font-bold px-3 py-1 rounded-full text-xs ${
                    p.exactScoreHit ? 'bg-gold-500/20 text-gold-400' :
                    p.outcomeHit ? 'bg-brand-500/20 text-brand-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    +{p.pointsAwarded ?? 0} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

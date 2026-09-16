import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { PaymentActions, DeletePaymentButton } from './PaymentActions'
import { AddPaymentModal } from './AddPaymentModal'
import { CreditCard } from 'lucide-react'

export const metadata = { title: 'Admin — Pagamentos' }

export default async function AdminPagamentosPage() {
  const [payments, users, phases] = await Promise.all([
    prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        phase: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.phase.findMany({
      select: { id: true, name: true, slug: true, entryFee: true },
      orderBy: { slug: 'asc' },
    }),
  ])

  const pending = payments.filter(p => p.status === 'PENDING')
  const approved = payments.filter(p => p.status === 'APPROVED')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={22} className="text-brand-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Gestão de Pagamentos</h1>
            <p className="text-slate-400 text-sm">{pending.length} pendentes · {approved.length} aprovados</p>
          </div>
        </div>
        <AddPaymentModal users={users} phases={phases} />
      </div>

      {/* Pendentes primeiro */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-orange-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-5 bg-orange-500 rounded-full" />
            Aguardando confirmação ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(p => (
              <PaymentCard key={p.id} payment={p} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Todos os pagamentos */}
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-2 h-5 bg-slate-500 rounded-full" />
          Todos os pagamentos ({payments.length})
        </h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a3147]">
                  {['Participante', 'Fase', 'Valor', 'Status', 'Data', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {payments.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.user.name}</p>
                      <p className="text-xs text-slate-500">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.phase.name}</td>
                    <td className="px-4 py-3 font-semibold text-white">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(p.createdAt, 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.status === 'PENDING' && <PaymentActions paymentId={p.id} />}
                        {p.status !== 'PENDING' && <DeletePaymentButton paymentId={p.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentCard({ payment, showActions }: { payment: any; showActions?: boolean }) {
  return (
    <div className="card p-4 border-orange-500/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-white">{payment.user.name}</p>
          <p className="text-xs text-slate-500">{payment.user.email} · {payment.user.phone}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
            <span>{payment.phase.name}</span>
            <span>·</span>
            <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
            <span>·</span>
            <span>{formatDate(payment.createdAt, 'dd/MM HH:mm')}</span>
          </div>
        </div>
        {showActions && <PaymentActions paymentId={payment.id} />}
      </div>
    </div>
  )
}

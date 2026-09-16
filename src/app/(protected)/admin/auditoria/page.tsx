import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Shield } from 'lucide-react'

export const metadata = { title: 'Admin — Auditoria' }

export default async function AdminAuditoriaPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const ACTION_COLORS: Record<string, string> = {
    REGISTER: 'bg-brand-500/20 text-brand-400',
    LOGIN: 'bg-blue-500/20 text-blue-400',
    SET_RESULT: 'bg-gold-500/20 text-gold-400',
    UPDATE_PAYMENT_STATUS: 'bg-orange-500/20 text-orange-400',
    UPDATE_PHASE_STATUS: 'bg-purple-500/20 text-purple-400',
    PAYMENT_CREATED: 'bg-slate-500/20 text-slate-400',
    SEED: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Shield size={22} className="text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoria</h1>
          <p className="text-slate-400 text-sm">Histórico de ações do sistema</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-surface-border">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-4 p-4 text-sm">
              <div className="flex-shrink-0 pt-0.5">
                <span className={`badge text-xs px-2 py-0.5 ${ACTION_COLORS[log.action] || 'badge-gray'}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{log.userName || 'Sistema'}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</span>
                </div>
                {log.newData && (
                  <p className="text-xs text-slate-500 mt-1 truncate font-mono">
                    {log.newData.slice(0, 120)}
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
                {formatDate(log.createdAt, 'dd/MM HH:mm')}
              </div>
            </div>
          ))}
        </div>
        {logs.length === 0 && (
          <div className="p-12 text-center text-slate-400">Nenhum registro de auditoria</div>
        )}
      </div>
    </div>
  )
}

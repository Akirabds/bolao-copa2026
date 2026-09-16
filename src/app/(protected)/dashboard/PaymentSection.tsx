'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { PaymentModal } from '@/components/PaymentModal'
import { CreditCard, Star, Target } from 'lucide-react'

interface Props {
  fase1: { phase: any; access: any; payment: any }
  fase2: { phase: any; access: any; payment: any }
}

export function PaymentSection({ fase1, fase2 }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<'fase1' | 'fase2' | null>(null)

  const needsFase1 = false // Fase 1 é gratuita
  const needsFase2 = !fase2.access && fase2.phase && ['OPEN_FOR_PAYMENT', 'OPEN_FOR_PREDICTIONS'].includes(fase2.phase.status)
  const pendingFase1 = false // Fase 1 é gratuita
  const pendingFase2 = fase2.payment?.status === 'PENDING'

  if (!needsFase1 && !needsFase2 && !pendingFase1 && !pendingFase2) return null

  function handleSuccess() {
    setModal(null)
    router.refresh()
  }

  return (
    <>
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-brand-400" />
          <h3 className="font-semibold text-white">Pagamentos</h3>
        </div>

        <div className="space-y-3">
          {needsFase1 && !pendingFase1 && (
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-brand-400" />
                <div>
                  <p className="text-sm font-medium text-white">Fase 1 — Grupos</p>
                  <p className="text-xs text-slate-400">{formatCurrency(fase1.phase.entryFee)}</p>
                </div>
              </div>
              <button onClick={() => setModal('fase1')} className="btn-primary btn-sm">
                Pagar
              </button>
            </div>
          )}

          {needsFase2 && !pendingFase2 && (
            <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Star size={18} className="text-gold-400" />
                <div>
                  <p className="text-sm font-medium text-white">Fase 2 — Mata-Mata</p>
                  <p className="text-xs text-slate-400">{formatCurrency(fase2.phase.entryFee)} · Acesso liberado após a Fase 1</p>
                </div>
              </div>
              <button onClick={() => setModal('fase2')} className="btn-gold btn-sm">
                Pagar
              </button>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <PaymentModal
          phase={modal}
          amount={modal === 'fase1' ? fase1.phase?.entryFee : fase2.phase?.entryFee}
          phaseName={modal === 'fase1' ? 'Fase 1 — Grupos' : 'Fase 2 — Mata-Mata'}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

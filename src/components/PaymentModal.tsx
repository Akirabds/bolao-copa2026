'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { X, ExternalLink, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentModalProps {
  phase: 'fase1' | 'fase2'
  amount: number
  phaseName: string
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentModal({ phase, amount, phaseName, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseSlug: phase }),
      })
      const data = await res.json()
      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl
      } else {
        toast.error(data.error || 'Erro ao gerar cobrança')
        setLoading(false)
      }
    } catch {
      toast.error('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm animate-slide-in">

        <div className="flex items-center justify-between p-5 border-b border-[#2a3147]">
          <h2 className="font-bold text-white">{phaseName}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-[#2a3147]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Valor */}
          <div className="bg-[#1a1f2e] rounded-xl p-4 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Valor</span>
            <span className="text-2xl font-bold text-brand-400">{formatCurrency(amount)}</span>
          </div>

          {/* Aviso fase 2 */}
          {phase === 'fase2' && (
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-3 flex gap-2">
              <AlertCircle size={15} className="text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gold-300">O acesso à Fase 2 é liberado somente após o encerramento da Fase 1.</p>
            </div>
          )}

          {/* Segurança */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-brand-500" />
            Você será redirecionado ao InfinityPay para finalizar o pagamento com segurança. PIX e cartão de crédito aceitos.
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handlePay} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Aguarde...</>
                : <><ExternalLink size={15} /> Ir para InfinityPay</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) { toast.success(data.message); router.refresh() }
    else toast.error(data.error)
    setLoading(null)
  }

  async function handleDelete() {
    if (!confirm('Excluir este pagamento? O acesso do usuário à fase será revogado.')) return
    setLoading('DELETE')
    const res = await fetch(`/api/admin/payments/${paymentId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success(data.message); router.refresh() }
    else toast.error(data.error)
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => updateStatus('APPROVED')} disabled={!!loading} className="btn-primary btn-sm gap-1">
        {loading === 'APPROVED' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
        Aprovar
      </button>
      <button onClick={() => updateStatus('REJECTED')} disabled={!!loading} className="btn-danger btn-sm gap-1">
        {loading === 'REJECTED' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
        Recusar
      </button>
      <button onClick={handleDelete} disabled={!!loading} className="btn-ghost btn-sm gap-1 text-red-400 hover:text-red-300">
        {loading === 'DELETE' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  )
}

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir este pagamento? O acesso do usuário à fase será revogado.')) return
    setLoading(true)
    const res = await fetch(`/api/admin/payments/${paymentId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success(data.message); router.refresh() }
    else toast.error(data.error)
    setLoading(false)
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-ghost btn-sm gap-1 text-red-400 hover:text-red-300">
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      Excluir
    </button>
  )
}

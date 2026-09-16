'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { getPhaseStatusLabel } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  PRE_REGISTRATION: 'Pré-inscrição',
  OPEN_FOR_PAYMENT: 'Abrir para pagamento',
  OPEN_FOR_PREDICTIONS: 'Abrir para palpites',
  CLOSED: 'Encerrar fase',
  SETTLED: 'Apurar resultados',
  PRIZED: 'Marcar como premiada',
}

const STATUS_CLASSES: Record<string, string> = {
  OPEN_FOR_PAYMENT: 'btn-primary',
  OPEN_FOR_PREDICTIONS: 'btn-primary',
  CLOSED: 'btn-danger',
  SETTLED: 'btn-gold',
  PRIZED: 'btn-gold',
  PRE_REGISTRATION: 'btn-secondary',
}

interface Props {
  phaseSlug: string
  nextStatuses: string[]
  currentStatus: string
}

export function PhaseStatusManager({ phaseSlug, nextStatuses, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    const label = STATUS_LABELS[status] || status
    const confirmed = window.confirm(`Confirmar: ${label}?\n\nEsta ação não pode ser desfeita facilmente.`)
    if (!confirmed) return

    setLoading(status)
    const res = await fetch(`/api/admin/phases/${phaseSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message)
      router.refresh()
    } else {
      toast.error(data.error)
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map(status => (
        <button
          key={status}
          onClick={() => updateStatus(status)}
          disabled={!!loading}
          className={`btn btn-sm ${STATUS_CLASSES[status] || 'btn-secondary'}`}
        >
          {loading === status && <Loader2 size={13} className="animate-spin" />}
          {STATUS_LABELS[status] || status}
        </button>
      ))}
    </div>
  )
}

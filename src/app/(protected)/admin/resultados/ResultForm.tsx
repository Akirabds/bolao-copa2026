'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Loader2, Edit2, RotateCcw } from 'lucide-react'

interface Props {
  matchId: string
  existing?: { score1: number; score2: number }
  compact?: boolean
}

export function ResultForm({ matchId, existing, compact }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [s1, setS1] = useState(existing?.score1 ?? '')
  const [s2, setS2] = useState(existing?.score2 ?? '')
  const [loading, setLoading] = useState(false)
  const [undoing, setUndoing] = useState(false)

  async function handleUndo() {
    if (!confirm('Desfazer resultado? Os pontos dos palpites serão resetados.')) return
    setUndoing(true)
    const res = await fetch('/api/admin/results', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    })
    const data = await res.json()
    if (data.success) { toast.success(data.message); router.refresh() }
    else toast.error(data.error)
    setUndoing(false)
  }

  async function handleSubmit() {
    if (s1 === '' || s2 === '') return toast.error('Preencha os dois placares')
    setLoading(true)
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, score1: Number(s1), score2: Number(s2) }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message)
      setOpen(false)
      router.refresh()
    } else {
      toast.error(data.error)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className={compact ? 'btn-secondary btn-sm gap-1' : 'btn-primary btn-sm gap-1'}
        >
          <Edit2 size={13} />
          {existing ? 'Corrigir' : 'Lançar resultado'}
        </button>
        {existing && (
          <button
            onClick={handleUndo}
            disabled={undoing}
            className="btn-ghost btn-sm gap-1 text-red-400 hover:text-red-300"
            title="Desfazer resultado"
          >
            {undoing ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            Desfazer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number" min={0} max={99}
        value={s1} onChange={e => setS1(e.target.value.replace(/\D/g, ''))}
        placeholder="0" className="w-14 text-center input py-1.5 px-2 text-base font-bold"
      />
      <span className="text-slate-500 font-bold">×</span>
      <input
        type="number" min={0} max={99}
        value={s2} onChange={e => setS2(e.target.value.replace(/\D/g, ''))}
        placeholder="0" className="w-14 text-center input py-1.5 px-2 text-base font-bold"
      />
      <button onClick={handleSubmit} disabled={loading} className="btn-primary btn-sm">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
      </button>
      <button onClick={() => setOpen(false)} className="btn-ghost btn-sm text-slate-500">✕</button>
    </div>
  )
}

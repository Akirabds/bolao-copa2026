'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function toBRTValue(kickoffAt: string): string {
  const brt = new Date(new Date(kickoffAt).getTime() - 3 * 3600000)
  return brt.toISOString().slice(0, 16)
}

export function KickoffEditor({ matchId, kickoffAt }: { matchId: string; kickoffAt: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(toBRTValue(kickoffAt))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function save() {
    setSaving(true)
    try {
      // Interpreta o valor como horário BRT (UTC-3) e converte para UTC
      const utcDate = new Date(value + ':00.000-03:00')
      const res = await fetch(`/api/admin/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kickoffAt: utcDate.toISOString() }),
      })
      if ((await res.json()).success) {
        toast.success('Horário atualizado')
        setEditing(false)
        router.refresh()
      } else {
        toast.error('Erro ao salvar')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="ml-1 p-0.5 text-slate-600 hover:text-brand-400 transition-colors"
        title="Editar horário (BRT)"
      >
        <Pencil size={11} />
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="datetime-local"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="bg-[#1a1f2e] border border-brand-600/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-brand-400"
      />
      <span className="text-xs text-slate-500">BRT</span>
      <button onClick={save} disabled={saving} className="p-0.5 text-green-400 hover:text-green-300 disabled:opacity-50">
        <Check size={13} />
      </button>
      <button onClick={() => setEditing(false)} className="p-0.5 text-slate-500 hover:text-white">
        <X size={13} />
      </button>
    </span>
  )
}

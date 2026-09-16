'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Plus, Loader2 } from 'lucide-react'

interface User { id: string; name: string; email: string }
interface Phase { id: string; name: string; slug: string; entryFee: number }

export function AddPaymentModal({ users, phases }: { users: User[]; phases: Phase[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [phaseSlug, setPhaseSlug] = useState('')
  const [status, setStatus] = useState('APPROVED')
  const [loading, setLoading] = useState(false)

  const selectedPhase = phases.find(p => p.slug === phaseSlug)

  async function handleSubmit() {
    if (!userId || !phaseSlug) return toast.error('Selecione o usuário e a fase')
    setLoading(true)
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, phaseSlug, status }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message)
      setOpen(false)
      setUserId('')
      setPhaseSlug('')
      router.refresh()
    } else {
      toast.error(data.error)
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary btn-sm gap-1.5">
        <Plus size={14} /> Adicionar pagamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Adicionar pagamento manual</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-[#2a3147]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Participante</label>
                <select value={userId} onChange={e => setUserId(e.target.value)} className="input w-full">
                  <option value="">Selecione...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Fase</label>
                <select value={phaseSlug} onChange={e => setPhaseSlug(e.target.value)} className="input w-full">
                  <option value="">Selecione...</option>
                  {phases.map(p => (
                    <option key={p.id} value={p.slug}>{p.name} — R$ {p.entryFee.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input w-full">
                  <option value="APPROVED">Aprovado (libera acesso)</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>

              {selectedPhase && (
                <div className="bg-[#1a1f2e] rounded-xl p-3 flex justify-between text-sm">
                  <span className="text-slate-400">Valor a registrar</span>
                  <span className="font-bold text-brand-400">R$ {selectedPhase.entryFee.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={loading || !userId || !phaseSlug} className="btn-primary flex-1 gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

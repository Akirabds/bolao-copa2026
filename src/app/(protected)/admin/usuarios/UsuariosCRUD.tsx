'use client'

import { useState } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { Edit2, Trash2, UserPlus, Lock, Unlock, Eye, EyeOff, X, Save, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PhaseAccess { status: string; phase: { name: string; slug: string } }
interface Ranking { totalPoints: number; phaseId: string }
interface User {
  id: string; name: string; email: string; phone?: string | null
  cpf?: string | null; role: string; isBlocked: boolean
  createdAt: string; phaseAccess: PhaseAccess[]; rankings: Ranking[]
}

interface ModalState {
  mode: 'create' | 'edit' | 'delete' | null
  user?: User
}

export function UsuariosCRUD({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [modal, setModal] = useState<ModalState>({ mode: null })
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? '').includes(search)
  )

  function refresh() { router.refresh() }

  async function handleBlock(u: User) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !u.isBlocked }),
    })
    const data = await res.json()
    if (data.success) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBlocked: !x.isBlocked } : x))
      toast.success(u.isBlocked ? 'Usuário desbloqueado' : 'Usuário bloqueado')
    } else toast.error(data.error)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="input pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="btn-primary btn-sm flex items-center gap-2 whitespace-nowrap"
        >
          <UserPlus size={15} />
          Novo usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3147]">
                {['Participante', 'Fase 1', 'Fase 2', 'Pontos', 'Cadastro', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3147]">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhum usuário encontrado</td></tr>
              )}
              {filtered.map(u => {
                const f1 = u.phaseAccess.find(a => a.phase.slug === 'fase1')
                const f2 = u.phaseAccess.find(a => a.phase.slug === 'fase2')
                const pts = u.rankings.reduce((s, r) => s + r.totalPoints, 0)
                return (
                  <tr key={u.id} className={cn('transition-colors hover:bg-[#1a1f2e]/50', u.isBlocked && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1a1f2e] rounded-full flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          {u.phone && <p className="text-xs text-slate-600">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{f1 ? <StatusBadge status={f1.status} size="sm" /> : <span className="text-xs text-slate-600">—</span>}</td>
                    <td className="px-4 py-3">{f2 ? <StatusBadge status={f2.status} size="sm" /> : <span className="text-xs text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 font-bold text-white">{pts || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(u.createdAt, 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3">
                      {u.isBlocked
                        ? <span className="badge-red">Bloqueado</span>
                        : <span className="badge-green">Ativo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ mode: 'edit', user: u })} title="Editar"
                          className="p-1.5 rounded hover:bg-[#2a3147] text-slate-400 hover:text-white transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleBlock(u)} title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                          className={cn('p-1.5 rounded transition-colors', u.isBlocked ? 'hover:bg-brand-600/20 text-slate-400 hover:text-brand-400' : 'hover:bg-gold-500/20 text-slate-400 hover:text-gold-400')}>
                          {u.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                        <button onClick={() => setModal({ mode: 'delete', user: u })} title="Excluir"
                          className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#2a3147] text-xs text-slate-500">
          {filtered.length} de {users.length} usuários
        </div>
      </div>

      {/* Modal criar/editar */}
      {(modal.mode === 'create' || modal.mode === 'edit') && (
        <UserFormModal
          user={modal.user}
          onClose={() => setModal({ mode: null })}
          onSaved={(updated) => {
            if (modal.mode === 'create') {
              setUsers(prev => [updated as User, ...prev])
            } else {
              setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
            }
            setModal({ mode: null })
            refresh()
          }}
        />
      )}

      {/* Modal excluir */}
      {modal.mode === 'delete' && modal.user && (
        <DeleteModal
          user={modal.user}
          onClose={() => setModal({ mode: null })}
          onDeleted={() => {
            setUsers(prev => prev.filter(u => u.id !== modal.user!.id))
            setModal({ mode: null })
          }}
        />
      )}
    </>
  )
}

// ─── Modal de criar / editar ───────────────────────────────────────────────

function UserFormModal({ user, onClose, onSaved }: {
  user?: User
  onClose: () => void
  onSaved: (u: Partial<User>) => void
}) {
  const isEdit = !!user
  const [form, setForm] = useState({
    name:     user?.name ?? '',
    email:    user?.email ?? '',
    phone:    user?.phone ?? '',
    cpf:      user?.cpf ?? '',
    password: '',
    role:     (user?.role ?? 'PARTICIPANT') as 'PARTICIPANT' | 'ADMIN',
  })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body: Record<string, unknown> = {
      name: form.name, email: form.email,
      phone: form.phone || null, cpf: form.cpf || null, role: form.role,
    }
    if (form.password) body.password = form.password
    if (!isEdit) body.password = form.password  // obrigatório na criação

    const res = await fetch(isEdit ? `/api/admin/users/${user!.id}` : '/api/admin/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      toast.success(isEdit ? 'Usuário atualizado' : 'Usuário criado')
      onSaved({ id: user?.id, ...form, ...data.data })
    } else {
      toast.error(data.error || 'Erro ao salvar')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md animate-slide-in">
        <div className="flex items-center justify-between p-5 border-b border-[#2a3147]">
          <h2 className="font-bold text-white">{isEdit ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-[#2a3147]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome completo</label>
              <input className="input" value={form.name} onChange={set('name')} required minLength={2} />
            </div>
            <div className="col-span-2">
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="label">CPF</label>
              <input className="input" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
            </div>
            <div className="col-span-2">
              <label className="label">{isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  required={!isEdit} minLength={isEdit ? 0 : 6}
                  placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">Perfil</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="PARTICIPANT">Participante</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal de excluir ──────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      toast.success('Usuário excluído')
      onDeleted()
    } else {
      toast.error(data.error || 'Erro ao excluir')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm animate-slide-in p-6 text-center">
        <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="font-bold text-white text-lg mb-1">Excluir usuário?</h3>
        <p className="text-slate-400 text-sm mb-1"><strong className="text-white">{user.name}</strong></p>
        <p className="text-slate-500 text-xs mb-6">{user.email}</p>
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
          Esta ação é irreversível. Todos os palpites e histórico do usuário serão removidos.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleDelete} disabled={loading} className="btn-danger flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

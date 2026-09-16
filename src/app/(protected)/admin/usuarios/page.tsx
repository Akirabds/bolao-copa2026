import { prisma } from '@/lib/prisma'
import { Users } from 'lucide-react'
import { UsuariosCRUD } from './UsuariosCRUD'

export const metadata = { title: 'Admin — Usuários' }

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({
    include: {
      phaseAccess: { include: { phase: { select: { name: true, slug: true } } } },
      rankings: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Users size={22} className="text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
          <p className="text-slate-400 text-sm">{users.length} usuários cadastrados</p>
        </div>
      </div>

      <UsuariosCRUD initialUsers={serialized} />
    </div>
  )
}

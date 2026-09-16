import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Navigation } from '@/components/Navigation'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navigation userName={session.name} role={session.role} />
      <div className="lg:pl-64">
        <main className="pt-14 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

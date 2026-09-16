'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PagamentoRetornoPage() {
  const params = useSearchParams()
  const router = useRouter()
  const ref = params.get('ref') ?? '' // "bolao-{paymentId}"

  const [status, setStatus] = useState<'checking' | 'approved' | 'pending' | 'rejected'>('checking')
  const [attempts, setAttempts] = useState(0)

  // Extrai phaseSlug do pagamento via API de status
  useEffect(() => {
    if (!ref) { setStatus('pending'); return }

    let tries = 0
    const maxTries = 12 // ~1 minuto

    async function check() {
      try {
        const res = await fetch(`/api/payments/retorno?ref=${encodeURIComponent(ref)}`)
        const data = await res.json()
        setAttempts(t => t + 1)

        if (data.status === 'APPROVED') {
          setStatus('approved')
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }
        if (data.status === 'REJECTED' || data.status === 'CANCELLED') {
          setStatus('rejected')
          return
        }

        tries++
        if (tries < maxTries) {
          setTimeout(check, 5000)
        } else {
          setStatus('pending')
        }
      } catch {
        setStatus('pending')
      }
    }

    check()
  }, [ref, router])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8 text-center space-y-4">

        {status === 'checking' && (
          <>
            <Loader2 size={48} className="mx-auto text-brand-400 animate-spin" />
            <p className="text-xl font-bold text-white">Verificando pagamento...</p>
            <p className="text-slate-400 text-sm">Aguarde enquanto confirmamos com o PagBank</p>
            {attempts > 2 && (
              <p className="text-xs text-slate-500">Isso pode levar alguns segundos...</p>
            )}
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="w-16 h-16 bg-brand-600/20 border border-brand-600/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} className="text-brand-400" />
            </div>
            <p className="text-xl font-bold text-white">Pagamento confirmado!</p>
            <p className="text-slate-400 text-sm">Seu acesso foi liberado. Redirecionando...</p>
            <Link href="/dashboard" className="btn-primary w-full inline-flex justify-center">
              Ir para o Dashboard
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto">
              <Clock size={36} className="text-gold-400" />
            </div>
            <p className="text-xl font-bold text-white">Pagamento em processamento</p>
            <p className="text-slate-400 text-sm">
              Seu pagamento está sendo processado. O acesso será liberado automaticamente assim que confirmado.
            </p>
            <Link href="/dashboard" className="btn-primary w-full inline-flex justify-center">
              Voltar ao Dashboard
            </Link>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={36} className="text-red-400" />
            </div>
            <p className="text-xl font-bold text-white">Pagamento não concluído</p>
            <p className="text-slate-400 text-sm">O pagamento foi cancelado ou recusado. Tente novamente.</p>
            <Link href="/dashboard" className="btn-primary w-full inline-flex justify-center">
              Tentar novamente
            </Link>
          </>
        )}

      </div>
    </div>
  )
}

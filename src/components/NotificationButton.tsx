'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function NotificationButton() {
  const [state, setState] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  async function handleToggle() {
    if (state === 'denied') {
      toast.error('Notificações bloqueadas — habilite nas configurações do navegador')
      return
    }

    const reg = await navigator.serviceWorker.ready

    if (state === 'subscribed') {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setState('unsubscribed')
      toast.success('Notificações desativadas')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setState('denied')
      toast.error('Permissão negada')
      return
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })

    setState('subscribed')
    toast.success('Notificações ativadas!')
  }

  // Registra o service worker na montagem
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  if (state === 'loading' || state === 'unsupported') return null

  const active = state === 'subscribed'

  return (
    <button
      onClick={handleToggle}
      title={active ? 'Desativar notificações' : 'Ativar notificações de partidas'}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'text-brand-400 hover:text-slate-200 hover:bg-surface-50'
          : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50'
      )}
    >
      {active ? <Bell size={18} className="text-brand-400" /> : <BellOff size={18} className="text-slate-500" />}
      {active ? 'Notificações ativas' : 'Ativar notificações'}
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

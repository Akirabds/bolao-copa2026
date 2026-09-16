'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SyncStatus {
  lastSync: string | null
  apiKeyConfigured: boolean
}

interface SyncResult {
  checked: number
  updated: number
  scored: number
  errors: string[]
  matches: { name: string; status: string; score: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Ao Vivo',
  FINISHED: 'Encerrado',
  SCHEDULED: 'Agendado',
  POSTPONED: 'Adiado',
}

export function SyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)
  const [autoSync, setAutoSync] = useState(false)

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/admin/sync-results')
    const data = await res.json()
    if (data.success) setStatus(data.data)
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // Auto-sync a cada 3 minutos quando ativado
  useEffect(() => {
    if (!autoSync) return
    const interval = setInterval(() => { handleSync(true) }, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoSync]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSync(silent = false) {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/sync-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.success) {
        setLastResult(data.data)
        await loadStatus()
        if (!silent) {
          if (data.data.updated > 0) {
            toast.success(`Sincronizado! ${data.data.updated} partida(s) atualizada(s)`)
          } else {
            toast.info('Nenhuma atualização encontrada')
          }
        }
      } else {
        toast.error(data.error || 'Erro na sincronização')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSyncing(false)
    }
  }

  const lastSyncLabel = status?.lastSync
    ? new Date(status.lastSync).toLocaleString('pt-BR')
    : 'Nunca'

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', status?.apiKeyConfigured ? 'bg-brand-400' : 'bg-red-400')} />
          <h3 className="font-semibold text-white text-sm">Sincronização Automática</h3>
        </div>
        <div className="flex items-center gap-2">
          {status?.apiKeyConfigured
            ? <Wifi size={14} className="text-brand-400" />
            : <WifiOff size={14} className="text-red-400" />
          }
          <span className="text-xs text-slate-500">API-Football</span>
        </div>
      </div>

      {!status?.apiKeyConfigured && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
          <p className="font-semibold mb-1">API Key não configurada</p>
          <p>Adicione <code className="bg-red-900/40 px-1 rounded">FOOTBALL_API_KEY=sua_chave</code> no arquivo <code className="bg-red-900/40 px-1 rounded">.env.local</code></p>
          <p className="mt-1 text-red-400">Obtenha gratuitamente em: rapidapi.com → API-Football</p>
        </div>
      )}

      {/* Last sync info */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock size={12} />
        <span>Última sync: <span className="text-slate-300">{lastSyncLabel}</span></span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSync(false)}
          disabled={syncing || !status?.apiKeyConfigured}
          className="btn-primary btn-sm flex items-center gap-2 flex-1"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </button>

        <button
          onClick={() => setAutoSync(!autoSync)}
          disabled={!status?.apiKeyConfigured}
          className={cn(
            'btn btn-sm px-3 py-1.5 text-xs border',
            autoSync
              ? 'bg-brand-600/20 text-brand-400 border-brand-600/40'
              : 'bg-surface-50 text-slate-400 border-[#2a3147]'
          )}
          title="Auto-sync a cada 3 minutos"
        >
          {autoSync ? 'Auto ON' : 'Auto OFF'}
        </button>
      </div>

      {autoSync && (
        <p className="text-xs text-brand-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Sincronizando automaticamente a cada 3 minutos
        </p>
      )}

      {/* Last result */}
      {lastResult && (
        <div className="border-t border-[#2a3147] pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#1a1f2e] rounded-lg p-2">
              <p className="text-lg font-bold text-white">{lastResult.checked}</p>
              <p className="text-xs text-slate-500">verificadas</p>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-2">
              <p className="text-lg font-bold text-brand-400">{lastResult.updated}</p>
              <p className="text-xs text-slate-500">atualizadas</p>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-2">
              <p className="text-lg font-bold text-gold-400">{lastResult.scored}</p>
              <p className="text-xs text-slate-500">pontuadas</p>
            </div>
          </div>

          {lastResult.matches.length > 0 && (
            <div className="space-y-1.5">
              {lastResult.matches.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-[#1a1f2e] rounded px-3 py-2">
                  <span className="text-slate-300">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{m.score}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-medium',
                      m.status === 'LIVE' ? 'bg-red-500/20 text-red-400' :
                      m.status === 'FINISHED' ? 'bg-slate-500/20 text-slate-400' :
                      'bg-brand-500/20 text-brand-400'
                    )}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lastResult.errors.length > 0 && (
            <div className="space-y-1">
              {lastResult.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 rounded px-3 py-2">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          )}

          {lastResult.updated === 0 && lastResult.errors.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 rounded px-3 py-2">
              <CheckCircle size={12} />
              Tudo atualizado, nenhuma mudança detectada
            </div>
          )}
        </div>
      )}
    </div>
  )
}

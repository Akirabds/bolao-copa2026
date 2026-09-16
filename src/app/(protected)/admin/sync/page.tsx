import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { SyncPanel } from './SyncPanel'

export const metadata = { title: 'Sincronização | Admin' }

export default function SyncPage() {
  const h = headers()
  if (h.get('x-user-role') !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <RefreshCw size={20} className="text-brand-400" />
          <h1 className="text-xl font-bold text-white">Sincronização de Resultados</h1>
        </div>
        <p className="text-slate-400 text-sm ml-8">
          Busca resultados em tempo real via API-Football e atualiza automaticamente as pontuações
        </p>
      </div>

      <div className="space-y-4">
        <SyncPanel />

        {/* Instruções de configuração */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">Como configurar</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">1</span>
              <div>
                <p className="text-slate-200">Crie uma conta grátis no RapidAPI</p>
                <p className="text-xs text-slate-500 mt-0.5">rapidapi.com → busque "API-Football" → Subscribe (Free plan)</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">2</span>
              <div>
                <p className="text-slate-200">Copie sua X-RapidAPI-Key</p>
                <p className="text-xs text-slate-500 mt-0.5">Disponível no painel do RapidAPI após assinar</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">3</span>
              <div>
                <p className="text-slate-200">Adicione no arquivo <code className="bg-[#1a1f2e] px-1.5 py-0.5 rounded text-brand-300">.env.local</code></p>
                <pre className="mt-1 bg-[#0f1117] border border-[#2a3147] rounded p-2 text-xs text-brand-300 overflow-x-auto">
{`FOOTBALL_API_KEY=sua_chave_aqui
SYNC_SECRET=qualquer_string_secreta`}
                </pre>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">4</span>
              <div>
                <p className="text-slate-200">Reinicie o servidor e clique em "Sincronizar agora"</p>
                <p className="text-xs text-slate-500 mt-0.5">Plano gratuito: 100 req/dia — suficiente para polling a cada 15 min</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Opção de polling automático via script */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-white text-sm">Polling automático (opcional)</h3>
          <p className="text-sm text-slate-400">
            Para sincronização sem precisar manter o navegador aberto, rode o script em segundo plano:
          </p>
          <pre className="bg-[#0f1117] border border-[#2a3147] rounded p-3 text-xs text-brand-300 overflow-x-auto">
{`node scripts/sync-poller.mjs`}
          </pre>
          <p className="text-xs text-slate-500">
            O script chama <code className="bg-[#1a1f2e] px-1 rounded">/api/admin/sync-results</code> a cada 5 minutos usando o SYNC_SECRET.
          </p>
        </div>
      </div>
    </div>
  )
}

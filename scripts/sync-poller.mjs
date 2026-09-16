#!/usr/bin/env node
// Polling script — roda em background e sincroniza resultados automaticamente
// Uso: node scripts/sync-poller.mjs
// Requer: SYNC_SECRET e FOOTBALL_API_KEY no .env.local

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lê .env.local manualmente (sem depender de dotenv)
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  const env = {}
  for (const file of envFiles) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...rest] = trimmed.split('=')
        if (key) env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
      }
    } catch {
      // arquivo não existe, ignora
    }
  }
  return env
}

const env = loadEnv()
const SYNC_SECRET = env.SYNC_SECRET
const BASE_URL = env.NEXT_PUBLIC_URL || 'http://localhost:3000'
const INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

if (!SYNC_SECRET) {
  console.error('❌ SYNC_SECRET não encontrado no .env.local')
  process.exit(1)
}

if (!env.FOOTBALL_API_KEY) {
  console.error('❌ FOOTBALL_API_KEY não encontrado no .env.local')
  process.exit(1)
}

const STARTUP_DELAY_MS = 8000 // aguarda o Next.js subir

console.log(`🔄 Bolão Sync Poller iniciado`)
console.log(`   URL: ${BASE_URL}`)
console.log(`   Intervalo: ${INTERVAL_MS / 1000}s (${INTERVAL_MS / 60000} min)`)
console.log(`   Pressione Ctrl+C para parar\n`)

async function waitForServer() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`).catch(() => null)
      if (res) return true
    } catch {}
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

async function sync() {
  const ts = new Date().toLocaleString('pt-BR')
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sync-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify({ secret: SYNC_SECRET }),
    })

    if (!res.ok) {
      console.log(`[${ts}] ⚠️  HTTP ${res.status}`)
      return
    }

    const data = await res.json()
    if (!data.success) {
      console.log(`[${ts}] ❌ Erro: ${data.error}`)
      return
    }

    const { checked, updated, scored, errors, matches } = data.data
    if (updated > 0 || scored > 0) {
      console.log(`[${ts}] ✅ ${checked} verificadas | ${updated} atualizadas | ${scored} pontuadas`)
      for (const m of matches) {
        console.log(`        • ${m.name}: ${m.score} [${m.status}]`)
      }
    } else if (errors.length > 0) {
      console.log(`[${ts}] ⚠️  ${errors[0]}`)
    } else {
      console.log(`[${ts}] ✓  Sem mudanças (${checked} partidas verificadas)`)
    }
  } catch (e) {
    console.log(`[${ts}] ❌ Falha na requisição: ${e.message}`)
  }
}

// Aguarda servidor subir, depois roda e agenda
console.log(`⏳ Aguardando servidor Next.js iniciar...`)
waitForServer().then(ok => {
  if (!ok) {
    console.log(`❌ Servidor não respondeu após 20s. Verifique se o Next.js está rodando.`)
    process.exit(1)
  }
  console.log(`✅ Servidor pronto. Iniciando sincronização.\n`)
  sync()
  setInterval(sync, INTERVAL_MS)
})

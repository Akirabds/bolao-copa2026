// Torna Fase 1 gratuita: entryFee=0, ACCESS_GRANTED para todos, remove prêmios
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const fase1 = await p.phase.findUnique({ where: { slug: 'fase1' } })
if (!fase1) { console.log('Fase 1 não encontrada'); process.exit(1) }

// 1. entryFee = 0
await p.phase.update({ where: { id: fase1.id }, data: { entryFee: 0 } })
console.log('✓ entryFee da Fase 1 → 0')

// 2. ACCESS_GRANTED para todos os usuários que ainda não têm acesso
const users = await p.user.findMany({ where: { role: 'PARTICIPANT', isActive: true } })
let granted = 0
for (const user of users) {
  await p.phaseAccess.upsert({
    where: { userId_phaseId: { userId: user.id, phaseId: fase1.id } },
    update: { status: 'ACCESS_GRANTED', grantedAt: new Date() },
    create: { userId: user.id, phaseId: fase1.id, status: 'ACCESS_GRANTED', grantedAt: new Date() },
  })
  granted++
}
console.log(`✓ ${granted} usuário(s) com ACCESS_GRANTED na Fase 1`)

// 3. Remove prêmios da Fase 1
const deleted = await p.prize.deleteMany({ where: { phaseId: fase1.id } })
console.log(`✓ ${deleted.count} prêmio(s) da Fase 1 removido(s)`)

// 4. Garante status OPEN_FOR_PREDICTIONS (se ainda estiver em OPEN_FOR_PAYMENT)
if (fase1.status === 'OPEN_FOR_PAYMENT') {
  await p.phase.update({ where: { id: fase1.id }, data: { status: 'OPEN_FOR_PREDICTIONS' } })
  console.log('✓ Status da Fase 1 → OPEN_FOR_PREDICTIONS')
}

await p.$disconnect()
console.log('\nFase 1 configurada como gratuita.')

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Atualiza WINNER de 10 para 15 pts
await p.scoreRule.update({
  where: { ruleKey: 'WINNER' },
  data: { points: 15 },
})

// Garante EXACT = 30
await p.scoreRule.update({
  where: { ruleKey: 'EXACT' },
  data: { points: 30 },
})

const rules = await p.scoreRule.findMany({ orderBy: { sortOrder: 'asc' } })
for (const r of rules) {
  console.log(`${r.ruleKey}: ${r.points} pts`)
}

await p.$disconnect()

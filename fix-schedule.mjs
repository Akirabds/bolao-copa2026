// Migração COMPLETA — horários oficiais Copa 2026 via ESPN (BRT = ET + 1h)
// Todos os 72 jogos da fase de grupos com UTC correto (BRT + 3h)
// Roda com: DATABASE_URL='file:///home/ubuntu/bolao/prisma/dev.db' node fix-schedule.mjs

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const SCHEDULE = [
  // ── RODADA 1 ─────────────────────────────────────────────────────────────

  // Grupo A
  { utc: '2026-06-11T19:00:00Z', t1: 'México',        t2: 'África do Sul'  }, // 11/06 16:00 BRT
  { utc: '2026-06-12T02:00:00Z', t1: 'Coreia do Sul', t2: 'Rep. Tcheca'    }, // 11/06 23:00 BRT

  // Grupo B
  { utc: '2026-06-12T19:00:00Z', t1: 'Canadá',        t2: 'Bósnia'         }, // 12/06 16:00 BRT
  { utc: '2026-06-13T19:00:00Z', t1: 'Catar',         t2: 'Suíça'          }, // 13/06 16:00 BRT

  // Grupo C
  { utc: '2026-06-13T22:00:00Z', t1: 'Brasil',        t2: 'Marrocos'       }, // 13/06 19:00 BRT ✓ confirmado
  { utc: '2026-06-14T01:00:00Z', t1: 'Haiti',         t2: 'Escócia'        }, // 13/06 22:00 BRT

  // Grupo D
  { utc: '2026-06-13T01:00:00Z', t1: 'EUA',           t2: 'Paraguai'       }, // 12/06 22:00 BRT
  { utc: '2026-06-14T04:00:00Z', t1: 'Austrália',     t2: 'Turquia'        }, // 14/06 01:00 BRT

  // Grupo E
  { utc: '2026-06-14T17:00:00Z', t1: 'Alemanha',      t2: 'Curaçao'        }, // 14/06 14:00 BRT
  { utc: '2026-06-14T23:00:00Z', t1: 'Costa do Marfim', t2: 'Equador'      }, // 14/06 20:00 BRT

  // Grupo F
  { utc: '2026-06-14T20:00:00Z', t1: 'Holanda',       t2: 'Japão'          }, // 14/06 17:00 BRT
  { utc: '2026-06-15T02:00:00Z', t1: 'Suécia',        t2: 'Tunísia'        }, // 14/06 23:00 BRT

  // Grupo G
  { utc: '2026-06-15T19:00:00Z', t1: 'Bélgica',       t2: 'Egito'          }, // 15/06 16:00 BRT
  { utc: '2026-06-16T01:00:00Z', t1: 'Irã',           t2: 'Nova Zelândia'  }, // 15/06 22:00 BRT

  // Grupo H
  { utc: '2026-06-15T16:00:00Z', t1: 'Espanha',       t2: 'Cabo Verde'     }, // 15/06 13:00 BRT
  { utc: '2026-06-15T22:00:00Z', t1: 'Arábia Saudita', t2: 'Uruguai'       }, // 15/06 19:00 BRT

  // Grupo I
  { utc: '2026-06-16T19:00:00Z', t1: 'França',        t2: 'Senegal'        }, // 16/06 16:00 BRT
  { utc: '2026-06-16T22:00:00Z', t1: 'Iraque',        t2: 'Noruega'        }, // 16/06 19:00 BRT

  // Grupo J
  { utc: '2026-06-17T01:00:00Z', t1: 'Argentina',     t2: 'Argélia'        }, // 16/06 22:00 BRT
  { utc: '2026-06-17T04:00:00Z', t1: 'Áustria',       t2: 'Jordânia'       }, // 17/06 01:00 BRT

  // Grupo K
  { utc: '2026-06-17T17:00:00Z', t1: 'Portugal',      t2: 'Congo'          }, // 17/06 14:00 BRT
  { utc: '2026-06-18T02:00:00Z', t1: 'Uzbequistão',   t2: 'Colômbia'       }, // 17/06 23:00 BRT

  // Grupo L
  { utc: '2026-06-17T20:00:00Z', t1: 'Inglaterra',    t2: 'Croácia'        }, // 17/06 17:00 BRT
  { utc: '2026-06-17T23:00:00Z', t1: 'Gana',          t2: 'Panamá'         }, // 17/06 20:00 BRT

  // ── RODADA 2 ─────────────────────────────────────────────────────────────

  // Grupo A
  { utc: '2026-06-18T16:00:00Z', t1: 'Rep. Tcheca',   t2: 'África do Sul'  }, // 18/06 13:00 BRT
  { utc: '2026-06-19T01:00:00Z', t1: 'México',        t2: 'Coreia do Sul'  }, // 18/06 22:00 BRT

  // Grupo B
  { utc: '2026-06-18T19:00:00Z', t1: 'Suíça',         t2: 'Bósnia'         }, // 18/06 16:00 BRT
  { utc: '2026-06-18T22:00:00Z', t1: 'Canadá',        t2: 'Catar'          }, // 18/06 19:00 BRT

  // Grupo C
  { utc: '2026-06-19T22:00:00Z', t1: 'Escócia',       t2: 'Marrocos'       }, // 19/06 19:00 BRT
  { utc: '2026-06-20T00:30:00Z', t1: 'Brasil',        t2: 'Haiti'          }, // 19/06 21:30 BRT

  // Grupo D
  { utc: '2026-06-19T19:00:00Z', t1: 'EUA',           t2: 'Austrália'      }, // 19/06 16:00 BRT
  { utc: '2026-06-20T03:00:00Z', t1: 'Turquia',       t2: 'Paraguai'       }, // 20/06 00:00 BRT

  // Grupo E
  { utc: '2026-06-20T20:00:00Z', t1: 'Alemanha',      t2: 'Costa do Marfim'}, // 20/06 17:00 BRT
  { utc: '2026-06-21T00:00:00Z', t1: 'Equador',       t2: 'Curaçao'        }, // 20/06 21:00 BRT

  // Grupo F
  { utc: '2026-06-20T17:00:00Z', t1: 'Holanda',       t2: 'Suécia'         }, // 20/06 14:00 BRT
  { utc: '2026-06-21T04:00:00Z', t1: 'Tunísia',       t2: 'Japão'          }, // 21/06 01:00 BRT

  // Grupo G
  { utc: '2026-06-21T19:00:00Z', t1: 'Bélgica',       t2: 'Irã'            }, // 21/06 16:00 BRT
  { utc: '2026-06-22T01:00:00Z', t1: 'Nova Zelândia', t2: 'Egito'          }, // 21/06 22:00 BRT

  // Grupo H
  { utc: '2026-06-21T16:00:00Z', t1: 'Espanha',       t2: 'Arábia Saudita' }, // 21/06 13:00 BRT
  { utc: '2026-06-21T22:00:00Z', t1: 'Uruguai',       t2: 'Cabo Verde'     }, // 21/06 19:00 BRT

  // Grupo I
  { utc: '2026-06-22T21:00:00Z', t1: 'França',        t2: 'Iraque'         }, // 22/06 18:00 BRT
  { utc: '2026-06-23T00:00:00Z', t1: 'Noruega',       t2: 'Senegal'        }, // 22/06 21:00 BRT

  // Grupo J
  { utc: '2026-06-22T17:00:00Z', t1: 'Argentina',     t2: 'Áustria'        }, // 22/06 14:00 BRT
  { utc: '2026-06-23T03:00:00Z', t1: 'Jordânia',      t2: 'Argélia'        }, // 23/06 00:00 BRT

  // Grupo K
  { utc: '2026-06-23T17:00:00Z', t1: 'Portugal',      t2: 'Uzbequistão'    }, // 23/06 14:00 BRT
  { utc: '2026-06-24T02:00:00Z', t1: 'Colômbia',      t2: 'Congo'          }, // 23/06 23:00 BRT

  // Grupo L
  { utc: '2026-06-23T20:00:00Z', t1: 'Inglaterra',    t2: 'Gana'           }, // 23/06 17:00 BRT
  { utc: '2026-06-23T23:00:00Z', t1: 'Panamá',        t2: 'Croácia'        }, // 23/06 20:00 BRT

  // ── RODADA 3 (simultâneos por grupo) ─────────────────────────────────────

  // Grupo A
  { utc: '2026-06-25T01:00:00Z', t1: 'Rep. Tcheca',   t2: 'México'         }, // 24/06 22:00 BRT
  { utc: '2026-06-25T01:00:00Z', t1: 'África do Sul', t2: 'Coreia do Sul'  }, // 24/06 22:00 BRT

  // Grupo B
  { utc: '2026-06-24T19:00:00Z', t1: 'Suíça',         t2: 'Canadá'         }, // 24/06 16:00 BRT
  { utc: '2026-06-24T19:00:00Z', t1: 'Bósnia',        t2: 'Catar'          }, // 24/06 16:00 BRT

  // Grupo C
  { utc: '2026-06-24T22:00:00Z', t1: 'Escócia',       t2: 'Brasil'         }, // 24/06 19:00 BRT
  { utc: '2026-06-24T22:00:00Z', t1: 'Marrocos',      t2: 'Haiti'          }, // 24/06 19:00 BRT

  // Grupo D
  { utc: '2026-06-26T02:00:00Z', t1: 'Turquia',       t2: 'EUA'            }, // 25/06 23:00 BRT
  { utc: '2026-06-26T02:00:00Z', t1: 'Paraguai',      t2: 'Austrália'      }, // 25/06 23:00 BRT

  // Grupo E
  { utc: '2026-06-25T20:00:00Z', t1: 'Curaçao',       t2: 'Costa do Marfim'}, // 25/06 17:00 BRT
  { utc: '2026-06-25T20:00:00Z', t1: 'Equador',       t2: 'Alemanha'       }, // 25/06 17:00 BRT

  // Grupo F
  { utc: '2026-06-25T23:00:00Z', t1: 'Japão',         t2: 'Suécia'         }, // 25/06 20:00 BRT
  { utc: '2026-06-25T23:00:00Z', t1: 'Tunísia',       t2: 'Holanda'        }, // 25/06 20:00 BRT

  // Grupo G
  { utc: '2026-06-27T03:00:00Z', t1: 'Egito',         t2: 'Irã'            }, // 27/06 00:00 BRT
  { utc: '2026-06-27T03:00:00Z', t1: 'Nova Zelândia', t2: 'Bélgica'        }, // 27/06 00:00 BRT

  // Grupo H
  { utc: '2026-06-27T00:00:00Z', t1: 'Cabo Verde',    t2: 'Arábia Saudita' }, // 26/06 21:00 BRT
  { utc: '2026-06-27T00:00:00Z', t1: 'Uruguai',       t2: 'Espanha'        }, // 26/06 21:00 BRT

  // Grupo I
  { utc: '2026-06-26T19:00:00Z', t1: 'Noruega',       t2: 'França'         }, // 26/06 16:00 BRT
  { utc: '2026-06-26T19:00:00Z', t1: 'Senegal',       t2: 'Iraque'         }, // 26/06 16:00 BRT

  // Grupo J
  { utc: '2026-06-28T02:00:00Z', t1: 'Jordânia',      t2: 'Argentina'      }, // 27/06 23:00 BRT
  { utc: '2026-06-28T02:00:00Z', t1: 'Argélia',       t2: 'Áustria'        }, // 27/06 23:00 BRT

  // Grupo K
  { utc: '2026-06-27T23:30:00Z', t1: 'Colômbia',      t2: 'Portugal'       }, // 27/06 20:30 BRT
  { utc: '2026-06-27T23:30:00Z', t1: 'Congo',         t2: 'Uzbequistão'    }, // 27/06 20:30 BRT

  // Grupo L
  { utc: '2026-06-27T21:00:00Z', t1: 'Panamá',        t2: 'Inglaterra'     }, // 27/06 18:00 BRT
  { utc: '2026-06-27T21:00:00Z', t1: 'Croácia',       t2: 'Gana'           }, // 27/06 18:00 BRT
]

let updated = 0
const notFound = []

for (const { utc, t1, t2 } of SCHEDULE) {
  const kickoffAt = new Date(utc)
  const predictionDeadlineAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000)

  const match = await p.match.findFirst({
    where: {
      OR: [
        { selection1: t1, selection2: t2 },
        { selection1: t2, selection2: t1 },
      ],
    },
  })

  if (!match) {
    notFound.push(`${t1} x ${t2}`)
    continue
  }

  await p.match.update({
    where: { id: match.id },
    data: { kickoffAt, predictionDeadlineAt },
  })

  const brt = new Date(kickoffAt.getTime() - 3 * 3600000)
  const brtStr = brt.toISOString().replace('T', ' ').slice(0, 16) + ' BRT'
  console.log(`✓ ${t1} x ${t2} → ${brtStr}`)
  updated++
}

console.log(`\n${updated}/72 jogos atualizados.`)
if (notFound.length) console.log(`NÃO ENCONTRADOS: ${notFound.join(', ')}`)

await p.$disconnect()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================================
// COPA DO MUNDO 2026 — DADOS COMPLETOS
// 48 seleções | 12 grupos | 72 jogos da fase de grupos
// ============================================================

// Grupos reais — sorteio oficial da FIFA realizado em dezembro de 2024
const GROUPS: Record<string, { name: string; flag: string }[]> = {
  A: [
    { name: 'México',          flag: '🇲🇽' },
    { name: 'África do Sul',   flag: '🇿🇦' },
    { name: 'Coreia do Sul',   flag: '🇰🇷' },
    { name: 'Rep. Tcheca',     flag: '🇨🇿' },
  ],
  B: [
    { name: 'Canadá',          flag: '🇨🇦' },
    { name: 'Bósnia',          flag: '🇧🇦' },
    { name: 'Catar',           flag: '🇶🇦' },
    { name: 'Suíça',           flag: '🇨🇭' },
  ],
  C: [
    { name: 'Brasil',          flag: '🇧🇷' },
    { name: 'Marrocos',        flag: '🇲🇦' },
    { name: 'Haiti',           flag: '🇭🇹' },
    { name: 'Escócia',         flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  ],
  D: [
    { name: 'EUA',             flag: '🇺🇸' },
    { name: 'Paraguai',        flag: '🇵🇾' },
    { name: 'Austrália',       flag: '🇦🇺' },
    { name: 'Turquia',         flag: '🇹🇷' },
  ],
  E: [
    { name: 'Alemanha',        flag: '🇩🇪' },
    { name: 'Curaçao',         flag: '🇨🇼' },
    { name: 'Costa do Marfim', flag: '🇨🇮' },
    { name: 'Equador',         flag: '🇪🇨' },
  ],
  F: [
    { name: 'Holanda',         flag: '🇳🇱' },
    { name: 'Japão',           flag: '🇯🇵' },
    { name: 'Suécia',          flag: '🇸🇪' },
    { name: 'Tunísia',         flag: '🇹🇳' },
  ],
  G: [
    { name: 'Bélgica',         flag: '🇧🇪' },
    { name: 'Egito',           flag: '🇪🇬' },
    { name: 'Irã',             flag: '🇮🇷' },
    { name: 'Nova Zelândia',   flag: '🇳🇿' },
  ],
  H: [
    { name: 'Espanha',         flag: '🇪🇸' },
    { name: 'Cabo Verde',      flag: '🇨🇻' },
    { name: 'Arábia Saudita',  flag: '🇸🇦' },
    { name: 'Uruguai',         flag: '🇺🇾' },
  ],
  I: [
    { name: 'França',          flag: '🇫🇷' },
    { name: 'Senegal',         flag: '🇸🇳' },
    { name: 'Iraque',          flag: '🇮🇶' },
    { name: 'Noruega',         flag: '🇳🇴' },
  ],
  J: [
    { name: 'Argentina',       flag: '🇦🇷' },
    { name: 'Argélia',         flag: '🇩🇿' },
    { name: 'Áustria',         flag: '🇦🇹' },
    { name: 'Jordânia',        flag: '🇯🇴' },
  ],
  K: [
    { name: 'Portugal',        flag: '🇵🇹' },
    { name: 'Congo',           flag: '🇨🇩' },
    { name: 'Uzbequistão',     flag: '🇺🇿' },
    { name: 'Colômbia',        flag: '🇨🇴' },
  ],
  L: [
    { name: 'Inglaterra',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Croácia',         flag: '🇭🇷' },
    { name: 'Gana',            flag: '🇬🇭' },
    { name: 'Panamá',          flag: '🇵🇦' },
  ],
}

// Venues da Copa 2026
const VENUES = [
  { location: 'Dallas, TX - EUA', stadium: 'AT&T Stadium' },
  { location: 'Los Angeles, CA - EUA', stadium: 'SoFi Stadium' },
  { location: 'Nova York/NJ - EUA', stadium: 'MetLife Stadium' },
  { location: 'Miami, FL - EUA', stadium: 'Hard Rock Stadium' },
  { location: 'San Francisco, CA - EUA', stadium: "Levi's Stadium" },
  { location: 'Seattle, WA - EUA', stadium: 'Lumen Field' },
  { location: 'Kansas City, MO - EUA', stadium: 'Arrowhead Stadium' },
  { location: 'Houston, TX - EUA', stadium: 'NRG Stadium' },
  { location: 'Atlanta, GA - EUA', stadium: 'Mercedes-Benz Stadium' },
  { location: 'Boston, MA - EUA', stadium: 'Gillette Stadium' },
  { location: 'Philadelphia, PA - EUA', stadium: 'Lincoln Financial Field' },
  { location: 'Vancouver - Canadá', stadium: 'BC Place' },
  { location: 'Toronto - Canadá', stadium: "BMO Field / Rogers Centre" },
  { location: 'Cidade do México - México', stadium: 'Estádio Azteca' },
  { location: 'Guadalajara - México', stadium: 'Estádio Akron' },
  { location: 'Monterrey - México', stadium: 'Estádio BBVA' },
]

// Gera as 6 partidas de cada grupo (todos contra todos)
function generateGroupMatches(
  groupCode: string,
  teams: { name: string; flag: string }[],
  baseDate: Date,
  phaseId: string
) {
  const matches: object[] = []
  const pairs = [
    [0, 1], [2, 3],
    [0, 2], [1, 3],
    [0, 3], [1, 2],
  ]
  const matchdays = [1, 1, 2, 2, 3, 3]

  pairs.forEach(([i, j], idx) => {
    const kickoff = new Date(baseDate)
    kickoff.setUTCDate(kickoff.getUTCDate() + Math.floor(idx / 2) * 2)
    kickoff.setUTCHours(18 + (idx % 2) * 5, 0, 0, 0) // 18:00 UTC = 15:00 BRT | 23:00 UTC = 20:00 BRT

    const venue = VENUES[Math.floor(Math.random() * VENUES.length)]
    const deadline = new Date(kickoff.getTime() - 30 * 60 * 1000)

    matches.push({
      phaseId,
      groupCode,
      matchday: matchdays[idx],
      selection1: teams[i].name,
      selection2: teams[j].name,
      flag1: teams[i].flag,
      flag2: teams[j].flag,
      kickoffAt: kickoff,
      predictionDeadlineAt: deadline,
      location: venue.location,
      stadium: venue.stadium,
      matchStatus: 'SCHEDULED',
      sortOrder: Object.keys(GROUPS).indexOf(groupCode) * 10 + idx,
    })
  })
  return matches
}

// Jogos do mata-mata (placeholders)
const KNOCKOUT_MATCHES = [
  // Oitavas de Final (16 jogos)
  ...Array.from({ length: 16 }, (_, i) => ({
    roundLabel: 'Oitavas de Final',
    matchday: i + 1,
    selection1: `Classificado ${String.fromCharCode(65 + i * 2)}`,
    selection2: `Classificado ${String.fromCharCode(65 + i * 2 + 1)}`,
    flag1: '🏳️',
    flag2: '🏳️',
    kickoffAt: new Date('2026-07-01T20:00:00Z'),
    location: 'A definir',
    stadium: 'A definir',
    matchStatus: 'SCHEDULED',
    sortOrder: 1000 + i,
  })),
  // Quartas de Final (8 jogos)
  ...Array.from({ length: 8 }, (_, i) => ({
    roundLabel: 'Quartas de Final',
    matchday: i + 1,
    selection1: 'A definir',
    selection2: 'A definir',
    flag1: '🏳️',
    flag2: '🏳️',
    kickoffAt: new Date('2026-07-09T20:00:00Z'),
    location: 'A definir',
    stadium: 'A definir',
    matchStatus: 'SCHEDULED',
    sortOrder: 2000 + i,
  })),
  // Semifinais (4 jogos)
  ...Array.from({ length: 4 }, (_, i) => ({
    roundLabel: 'Semifinal',
    matchday: i + 1,
    selection1: 'A definir',
    selection2: 'A definir',
    flag1: '🏳️',
    flag2: '🏳️',
    kickoffAt: new Date('2026-07-14T20:00:00Z'),
    location: 'A definir',
    stadium: 'A definir',
    matchStatus: 'SCHEDULED',
    sortOrder: 3000 + i,
  })),
  // Disputa 3º Lugar
  {
    roundLabel: '3º Lugar',
    matchday: 1,
    selection1: 'A definir',
    selection2: 'A definir',
    flag1: '🏳️',
    flag2: '🏳️',
    kickoffAt: new Date('2026-07-18T16:00:00Z'),
    location: 'Cidade do México - México',
    stadium: 'Estádio Azteca',
    matchStatus: 'SCHEDULED',
    sortOrder: 4000,
  },
  // Final
  {
    roundLabel: 'Final',
    matchday: 1,
    selection1: 'A definir',
    selection2: 'A definir',
    flag1: '🏳️',
    flag2: '🏳️',
    kickoffAt: new Date('2026-07-19T17:00:00Z'),
    location: 'Nova York/NJ - EUA',
    stadium: 'MetLife Stadium',
    matchStatus: 'SCHEDULED',
    sortOrder: 5000,
  },
]

async function main() {
  console.log('🌱 Iniciando seed da Copa do Mundo 2026...')

  // Limpar dados existentes
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.termsAcceptance.deleteMany()
  await prisma.paymentEvent.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.prediction.deleteMany()
  await prisma.matchResultLog.deleteMany()
  await prisma.match.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.ranking.deleteMany()
  await prisma.phaseAccess.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.user.deleteMany()
  await prisma.scoreRule.deleteMany()
  await prisma.systemSetting.deleteMany()

  console.log('✓ Banco limpo')

  // =============================================
  // ADMIN
  // =============================================
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bolao.com'
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@2026'

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Administrador',
      passwordHash: await bcrypt.hash(adminPass, 12),
      role: 'ADMIN',
    },
  })
  console.log(`✓ Admin criado: ${adminEmail} / ${adminPass}`)

  // =============================================
  // USUÁRIOS DE TESTE
  // =============================================
  const testUsers = [
    { name: 'João Silva',      email: 'joao@teste.com',    phone: '11999990001' },
    { name: 'Maria Santos',    email: 'maria@teste.com',   phone: '11999990002' },
    { name: 'Pedro Oliveira',  email: 'pedro@teste.com',   phone: '11999990003' },
    { name: 'Ana Costa',       email: 'ana@teste.com',     phone: '11999990004' },
    { name: 'Carlos Ferreira', email: 'carlos@teste.com',  phone: '11999990005' },
  ]

  const createdUsers = await Promise.all(
    testUsers.map(u =>
      prisma.user.create({
        data: { ...u, passwordHash: bcrypt.hashSync('Senha@123', 12) },
      })
    )
  )
  console.log(`✓ ${createdUsers.length} usuários de teste criados (senha: Senha@123)`)

  // =============================================
  // FASES
  // =============================================
  const fase1 = await prisma.phase.create({
    data: {
      name: 'Fase 1 — Fase de Grupos',
      slug: 'fase1',
      type: 'GROUP_STAGE',
      entryFee: 19.90,
      status: 'OPEN_FOR_PAYMENT',
      description: 'Palpites para todos os jogos da fase de grupos da Copa do Mundo 2026.',
    },
  })

  const fase2 = await prisma.phase.create({
    data: {
      name: 'Fase 2 — Mata-Mata',
      slug: 'fase2',
      type: 'KNOCKOUT',
      entryFee: 10.00,
      status: 'OPEN_FOR_PAYMENT',
      description: 'Palpites para os jogos eliminatórios: oitavas, quartas, semifinais e final.',
    },
  })
  console.log('✓ Fases criadas')

  // =============================================
  // PARTIDAS — FASE DE GRUPOS
  // =============================================
  const groupStartDate = new Date('2026-06-11T00:00:00Z')
  const allGroupMatches: any[] = []

  for (const [groupCode, teams] of Object.entries(GROUPS)) {
    const groupDate = new Date(groupStartDate)
    const groupIndex = Object.keys(GROUPS).indexOf(groupCode)
    groupDate.setDate(groupDate.getDate() + groupIndex)
    const matches = generateGroupMatches(groupCode, teams, groupDate, fase1.id)
    allGroupMatches.push(...matches)
  }

  await prisma.match.createMany({ data: allGroupMatches })
  console.log(`✓ ${allGroupMatches.length} partidas da fase de grupos criadas`)

  // =============================================
  // PARTIDAS — MATA-MATA (placeholders)
  // =============================================
  await prisma.match.createMany({
    data: KNOCKOUT_MATCHES.map(m => ({ ...m, phaseId: fase2.id })),
  })
  console.log(`✓ ${KNOCKOUT_MATCHES.length} partidas do mata-mata criadas`)

  // =============================================
  // REGRAS DE PONTUAÇÃO
  // =============================================
  await prisma.scoreRule.createMany({
    data: [
      {
        ruleKey: 'EXACT',
        name: 'Placar Exato',
        description: 'Acertou o placar exato da partida',
        points: 30,
        sortOrder: 1,
      },
      {
        ruleKey: 'WINNER_WINNER_GOALS',
        name: 'Vencedor + Gols do Vencedor',
        description: 'Acertou o vencedor e a quantidade de gols da seleção vencedora',
        points: 20,
        sortOrder: 2,
      },
      {
        ruleKey: 'DRAW',
        name: 'Empate Certo',
        description: 'Acertou o empate, mas não o placar exato',
        points: 15,
        sortOrder: 3,
      },
      {
        ruleKey: 'WINNER_LOSER_GOALS',
        name: 'Vencedor + Gols do Perdedor',
        description: 'Acertou o vencedor e a quantidade de gols da seleção perdedora',
        points: 12,
        sortOrder: 4,
      },
      {
        ruleKey: 'WINNER',
        name: 'Apenas o Vencedor',
        description: 'Acertou apenas o vencedor da partida',
        points: 15,
        sortOrder: 5,
      },
      {
        ruleKey: 'MISS',
        name: 'Errou',
        description: 'Não acertou nenhuma condição',
        points: 0,
        sortOrder: 6,
      },
    ],
  })
  console.log('✓ Regras de pontuação criadas')

  // =============================================
  // PREMIAÇÃO
  // =============================================
  await prisma.prize.createMany({
    data: [
      { phaseId: fase1.id, position: 1, percentage: 50, description: '1º Lugar — Fase de Grupos' },
      { phaseId: fase1.id, position: 2, percentage: 30, description: '2º Lugar — Fase de Grupos' },
      { phaseId: fase1.id, position: 3, percentage: 20, description: '3º Lugar — Fase de Grupos' },
      { phaseId: fase2.id, position: 1, percentage: 100, description: '1º Lugar — Mata-Mata' },
    ],
  })
  console.log('✓ Configuração de premiação criada')

  // =============================================
  // CONFIGURAÇÕES DO SISTEMA
  // =============================================
  const settings = [
    { key: 'platform_fee_percent', value: '10', label: 'Taxa da plataforma (%)' },
    { key: 'terms_version', value: '"1.0"', label: 'Versão atual do regulamento' },
    { key: 'maintenance_mode', value: 'false', label: 'Modo manutenção' },
    { key: 'allow_new_registrations', value: 'true', label: 'Permitir novos cadastros' },
    { key: 'tiebreak_order', value: '["totalPoints","exactScores","outcomeHits","lastPredictionAt"]', label: 'Ordem de desempate' },
    {
      key: 'score_rules_config',
      value: JSON.stringify({
        EXACT: 30,
        WINNER_WINNER_GOALS: 20,
        DRAW: 15,
        WINNER_LOSER_GOALS: 12,
        WINNER: 10,
        MISS: 0,
      }),
      label: 'Pontuação configurável',
    },
  ]

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, label: s.label },
      create: s,
    })
  }
  console.log('✓ Configurações do sistema criadas')

  // =============================================
  // PAGAMENTOS E ACESSO DE TESTE
  // =============================================
  // Usuário 0 e 1: pagamento aprovado na Fase 1
  for (let i = 0; i < 2; i++) {
    const payment = await prisma.payment.create({
      data: {
        userId: createdUsers[i].id,
        phaseId: fase1.id,
        amount: 19.90,
        gateway: 'manual',
        status: 'APPROVED',
        paidAt: new Date(),
      },
    })
    await prisma.phaseAccess.create({
      data: {
        userId: createdUsers[i].id,
        phaseId: fase1.id,
        status: 'ACCESS_GRANTED',
        grantedAt: new Date(),
      },
    })
    await prisma.ranking.create({
      data: {
        userId: createdUsers[i].id,
        phaseId: fase1.id,
        totalPoints: 0,
      },
    })
  }
  // Usuário 2: pagamento pendente
  await prisma.payment.create({
    data: {
      userId: createdUsers[2].id,
      phaseId: fase1.id,
      amount: 19.90,
      gateway: 'manual',
      status: 'PENDING',
    },
  })
  await prisma.phaseAccess.create({
    data: {
      userId: createdUsers[2].id,
      phaseId: fase1.id,
      status: 'PENDING',
    },
  })
  // Usuário 3: pagou Fase 2 antecipadamente
  await prisma.payment.create({
    data: {
      userId: createdUsers[3].id,
      phaseId: fase1.id,
      amount: 19.90,
      gateway: 'manual',
      status: 'APPROVED',
      paidAt: new Date(),
    },
  })
  await prisma.phaseAccess.create({
    data: {
      userId: createdUsers[3].id,
      phaseId: fase1.id,
      status: 'ACCESS_GRANTED',
      grantedAt: new Date(),
    },
  })
  await prisma.payment.create({
    data: {
      userId: createdUsers[3].id,
      phaseId: fase2.id,
      amount: 10.00,
      gateway: 'manual',
      status: 'APPROVED',
      paidAt: new Date(),
    },
  })
  await prisma.phaseAccess.create({
    data: {
      userId: createdUsers[3].id,
      phaseId: fase2.id,
      status: 'AWAITING_PHASE_RELEASE',
    },
  })
  await prisma.ranking.createMany({
    data: [
      { userId: createdUsers[3].id, phaseId: fase1.id, totalPoints: 0 },
    ],
  })
  console.log('✓ Dados de teste de pagamentos criados')

  // =============================================
  // LOG DE AUDITORIA INICIAL
  // =============================================
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'SEED',
      entity: 'System',
      newData: JSON.stringify({ message: 'Seed inicial executado com sucesso' }),
    },
  })

  console.log('\n🏆 Seed concluído com sucesso!')
  console.log('─────────────────────────────────────────')
  console.log(`🔑 Admin:       ${adminEmail} / ${adminPass}`)
  console.log(`👤 Participante: joao@teste.com / Senha@123`)
  console.log(`👤 Participante: maria@teste.com / Senha@123`)
  console.log('─────────────────────────────────────────')
}

main()
  .catch(e => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

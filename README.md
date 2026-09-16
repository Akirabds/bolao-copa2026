# Bolão da Copa 2026

Sistema completo de bolão para a Copa do Mundo FIFA 2026 — desenvolvido com Next.js 14, Prisma e Tailwind CSS.

---

## Início Rápido

### Pré-requisitos
- **Node.js** 20 ou superior
- **npm**

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
# Edite o .env.local com suas configurações
```

Variáveis necessárias:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aleatoria"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# InfinityPay (pagamentos via PIX e cartão)
INFINITEPAY_HANDLE="seu-handle-infinitepay"

# API-Football via RapidAPI (sincronização de resultados)
FOOTBALL_API_KEY="sua_chave_rapidapi"
FOOTBALL_API_HOST="api-football-v1.p.rapidapi.com"
FOOTBALL_LEAGUE_ID="1"
FOOTBALL_SEASON="2026"
```

### 3. Inicializar banco de dados
```bash
npm run db:generate   # Gerar cliente Prisma
npm run db:push       # Criar tabelas no banco
npm run db:seed       # Popular com dados da Copa 2026
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Credenciais Padrão (após seed)

| Tipo | E-mail | Senha |
|------|--------|-------|
| Administrador | (definido em `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env.local`) | — |
| Participante (pago) | joao@teste.com | Senha@123 |
| Participante (pago) | maria@teste.com | Senha@123 |
| Participante (pendente) | pedro@teste.com | Senha@123 |
| Participante (F2 antecipada) | ana@teste.com | Senha@123 |

> Os participantes acima são apenas dados fictícios do seed (`prisma/seed.ts`) para desenvolvimento local.

---

## Estrutura do Projeto

```
bolao-copa2026/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.ts                # Dados iniciais + Copa 2026
├── scripts/
│   ├── sync-poller.mjs        # Pooler de sync de resultados (roda junto com next)
│   ├── deploy-vm.sh           # Setup inicial da VM (roda na VM)
│   └── upload-vm.ps1          # Upload para VM Oracle (ver seção Deploy)
├── src/
│   ├── app/
│   │   ├── (protected)/       # Rotas autenticadas
│   │   │   ├── dashboard/     # Dashboard do participante
│   │   │   ├── fase/[slug]/   # Tela de palpites por fase
│   │   │   ├── ranking/       # Ranking público
│   │   │   ├── perfil/        # Perfil do usuário
│   │   │   └── admin/         # Painel administrativo
│   │   │       ├── page.tsx         # Dashboard admin (KPIs)
│   │   │       ├── pagamentos/      # Gestão de pagamentos
│   │   │       ├── resultados/      # Lançar/desfazer resultados
│   │   │       ├── partidas/        # Visualizar partidas
│   │   │       ├── fases/           # Controle de fases
│   │   │       ├── sync/            # Sync com API-Football
│   │   │       ├── usuarios/        # Gestão de usuários
│   │   │       ├── premiacao/       # Configuração de prêmios
│   │   │       └── auditoria/       # Logs do sistema
│   │   ├── api/               # API Routes (Next.js)
│   │   │   ├── auth/          # Login / Logout / Me
│   │   │   ├── register/      # Cadastro
│   │   │   ├── matches/       # Listagem de partidas
│   │   │   ├── predictions/   # CRUD de palpites
│   │   │   ├── ranking/       # Ranking
│   │   │   ├── payments/      # Pagamentos InfinityPay + webhook
│   │   │   ├── dashboard/     # Dashboard data
│   │   │   └── admin/         # APIs administrativas
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Tela de login
│   │   ├── cadastro/          # Tela de cadastro
│   │   └── regulamento/       # Regulamento completo
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Navigation.tsx     # Sidebar / top bar
│   │   ├── MatchCard.tsx      # Card de partida com palpite
│   │   ├── RankingTable.tsx   # Tabela de ranking
│   │   ├── StatusBadge.tsx    # Badge de status
│   │   ├── ProgressBar.tsx    # Barra de progresso
│   │   └── PaymentModal.tsx   # Modal de pagamento InfinityPay
│   ├── lib/
│   │   ├── auth.ts            # JWT + cookies
│   │   ├── prisma.ts          # Singleton Prisma
│   │   ├── scoring.ts         # Motor de pontuação
│   │   ├── infinitepay.ts     # Integração InfinityPay
│   │   └── utils.ts           # Utilitários (formatDate, toBRT, etc.)
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── middleware.ts          # Proteção de rotas
├── .env.local                 # Variáveis de ambiente (não commitar)
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## Funcionalidades Implementadas

### Área do Participante
- Landing page com apresentação completa do bolão
- Cadastro com aceite de regulamento
- Login / Logout com JWT seguro
- Dashboard com status de cada fase
- Palpites da Fase 1 (72 jogos da fase de grupos)
- Palpites da Fase 2 (32 jogos eliminatórios)
- Bloqueio automático de palpites no início de cada jogo
- Palpites só disponíveis quando a fase estiver `OPEN_FOR_PREDICTIONS`
- Filtro por grupo e por data
- Barra de progresso dos palpites
- Resumo de pontos parciais (total, placar exato, resultado certo)
- Ranking da Fase 1 e Fase 2
- Perfil com histórico de pagamentos e palpites
- Pagamento via PIX e cartão (InfinityPay Checkout)
- Regulamento completo

### Área Administrativa
- Dashboard com KPIs financeiros e de participação
- Gestão de pagamentos: aprovar, recusar, adicionar manual, excluir
- Lançamento de resultados oficiais e desfazer resultado
- Recálculo automático de pontuação e ranking
- Controle do ciclo de vida das fases (abrir, fechar, etc.)
- Liberação automática da Fase 2 ao encerrar a Fase 1
- Sincronização de resultados via API-Football (100 req/dia grátis)
- Auto-sync a cada 3 minutos (ativável no painel)
- Visualização de partidas por grupo
- Lista de participantes com status detalhado
- Configuração e visualização de premiação
- Log de auditoria completo

### Regras de Negócio
- Motor de pontuação com 6 faixas configuráveis
- Desempate por múltiplos critérios
- Fase 2 bloqueada até encerramento da Fase 1
- Pagamento antecipado da Fase 2 com liberação automática
- Todos os 48 times e 12 grupos reais da Copa do Mundo 2026
- Horários sempre exibidos no fuso de Brasília (UTC-3)

---

## Configurações

### Banco de dados
Por padrão usa **SQLite** (arquivo local `dev.db`).

### Pontuação (configurável via banco)
Edite a setting `score_rules_config` via Admin ou diretamente no banco:
```json
{
  "EXACT": 30,
  "WINNER_WINNER_GOALS": 20,
  "DRAW": 15,
  "WINNER_LOSER_GOALS": 12,
  "WINNER": 10,
  "MISS": 0
}
```

### Taxa da plataforma
Altere `platform_fee_percent` nas configurações do sistema (padrão: 10%).

---

## Integração de Pagamentos — InfinityPay

O sistema usa **InfinityPay Checkout** para geração de links de pagamento (PIX + cartão).

Configuração no `.env.local`:
```env
INFINITEPAY_HANDLE="seu-handle-infinitepay"
```

O handle é o identificador da sua conta InfinityPay.
Sem necessidade de token ou whitelist — funciona imediatamente após criar a conta.

Endpoints relevantes:
- `POST /api/payments` — cria checkout e retorna link de pagamento
- `GET /api/payments/retorno` — callback após pagamento (InfinityPay redireciona aqui)
- `POST /api/payments/webhook` — webhook de confirmação

---

## Sincronização de Resultados — API-Football

O sistema sincroniza resultados automaticamente via [API-Football](https://rapidapi.com/api-sports/api/api-football) no RapidAPI.

Plano gratuito: **100 requisições/dia** — suficiente para 4 jogos/dia com margem.

Configure no `.env.local`:
```env
FOOTBALL_API_KEY="sua_chave_rapidapi"
FOOTBALL_API_HOST="api-football-v1.p.rapidapi.com"
FOOTBALL_LEAGUE_ID="1"
FOOTBALL_SEASON="2026"
```

O sync pode ser disparado manualmente no Admin → Sync, ou ativado automático a cada 3 minutos.

---

## Deploy em Produção — Oracle Cloud VM

O projeto foi hospedado em uma **VM Oracle Cloud Free Tier** (`VM.Standard.E2.1.Micro`, 1 OCPU, 1GB RAM) com swap de 2GB, acessada via SSH e exposta com DNS dinâmico (DuckDNS) e Nginx na frente.

**Dados da infraestrutura (exemplo):**
- IP: `<IP_DA_SUA_VM>`
- Usuário: `ubuntu`
- Chave SSH: `<sua-chave>.key` (fora do repositório, nunca commitada)
- Gerenciador de processo: PM2 (app name: `bolao`)

### Passo a passo do deploy

> O script `upload-vm.ps1` tem bug de encoding no PowerShell 5.1 — usar os comandos abaixo diretamente.

**1. Build local:**
```powershell
cd caminho/do/projeto
npm run build:next
```

**2. Criar estrutura na VM (apenas primeira vez):**
```powershell
ssh -i "<sua-chave>.key" -o StrictHostKeyChecking=no ubuntu@<IP_DA_SUA_VM> "mkdir -p ~/bolao/scripts ~/bolao/prisma ~/bolao/public"
```

**3. Enviar arquivos:**
```powershell
$key = "<sua-chave>.key"
$t   = "ubuntu@<IP_DA_SUA_VM>"
$o   = "-i `"$key`" -o StrictHostKeyChecking=no"

scp -r $o .next            "${t}:~/bolao/"
scp    $o package.json     "${t}:~/bolao/package.json"
scp    $o package-lock.json "${t}:~/bolao/package-lock.json"
scp    $o next.config.js   "${t}:~/bolao/next.config.js"
scp    $o .env.local       "${t}:~/bolao/.env.local"
scp    $o prisma/schema.prisma "${t}:~/bolao/prisma/schema.prisma"
scp    $o scripts/sync-poller.mjs "${t}:~/bolao/scripts/sync-poller.mjs"
```

**4. Reiniciar na VM:**
```powershell
ssh -i "<sua-chave>.key" -o StrictHostKeyChecking=no ubuntu@<IP_DA_SUA_VM> @'
cd ~/bolao
npm install --omit=dev --silent
npx prisma generate 2>/dev/null
pm2 restart bolao 2>/dev/null || pm2 start npm --name bolao -- run start -- -H 0.0.0.0
pm2 save
'@
```

### Comandos úteis na VM
```bash
pm2 status           # Status do processo
pm2 logs bolao       # Logs em tempo real
pm2 restart bolao    # Reiniciar
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Banco de dados | SQLite (via Prisma) |
| ORM | Prisma |
| Autenticação | JWT + httpOnly cookies (jose) |
| Validação | Zod |
| Ícones | Lucide React |
| Toasts | Sonner |
| Pagamentos | InfinityPay Checkout (PIX + cartão) |
| Resultados | API-Football via RapidAPI |
| Hospedagem | Oracle Cloud Free Tier + PM2 + Nginx |
| DNS | DuckDNS (domínio dinâmico) |

---

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (Next + sync-poller)
npm run build:next   # Build de produção (Next.js)
npm run start        # Iniciar em produção (Next + sync-poller)
npm run db:generate  # Gerar cliente Prisma
npm run db:push      # Sincronizar schema
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Interface visual do banco (Prisma Studio)
npm run db:reset     # Resetar e re-popular banco
```

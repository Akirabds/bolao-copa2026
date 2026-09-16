#!/bin/bash
# =============================================================
# Bolão Copa 2026 — Script de deploy para Oracle Cloud Free Tier
# VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
# Uso: bash deploy-vm.sh
# =============================================================

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}[$1]${NC} $2"; }

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║   Bolão Copa 2026 — Setup Oracle Cloud   ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================
# 1. SWAP (evita OOM na VM de 1GB)
# =============================================================
step "1/7" "Configurando swap de 2GB"

if swapon --show | grep -q '/swapfile'; then
  warn "Swap já configurado, pulando..."
else
  info "Criando swapfile de 2GB..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile

  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
  fi
  log "Swap de 2GB ativado"
fi

free -h | grep -E "Mem|Swap"

# =============================================================
# 2. NODE.JS 20
# =============================================================
step "2/7" "Instalando Node.js 20"

if command -v node &> /dev/null && [[ $(node -v) == v20* ]]; then
  log "Node.js $(node -v) já instalado"
else
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y nodejs > /dev/null 2>&1
  log "Node.js $(node -v) instalado"
fi

# =============================================================
# 3. PM2
# =============================================================
step "3/7" "Instalando PM2"

if command -v pm2 &> /dev/null; then
  log "PM2 já instalado"
else
  sudo npm install -g pm2 > /dev/null 2>&1
  log "PM2 instalado"
fi

# =============================================================
# 4. DEPENDÊNCIAS DO PROJETO
# =============================================================
step "4/7" "Instalando dependências de produção"

if [ ! -f "package.json" ]; then
  err "package.json não encontrado. Execute este script na pasta do projeto."
fi

info "Instalando apenas dependências de produção (--omit=dev)..."
npm install --omit=dev --silent
log "Dependências instaladas"

# =============================================================
# 5. BANCO DE DADOS
# =============================================================
step "5/7" "Configurando banco de dados"

info "Gerando Prisma client..."
npx prisma generate > /dev/null 2>&1

info "Aplicando schema no banco..."
npx prisma db push > /dev/null 2>&1
log "Schema aplicado"

# Pergunta se quer rodar o seed
echo ""
read -p "  Rodar seed (dados iniciais + admin + times)? [s/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  info "Rodando seed..."
  npm run db:seed 2>&1 | tail -3
  log "Seed concluído"
fi

# =============================================================
# 6. FIREWALL
# =============================================================
step "6/7" "Configurando firewall"

info "Liberando porta 3000..."
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true

# Tenta instalar netfilter-persistent para salvar regras
if command -v netfilter-persistent &> /dev/null; then
  sudo netfilter-persistent save > /dev/null 2>&1
  log "Regras de firewall salvas"
else
  sudo apt-get install -y iptables-persistent > /dev/null 2>&1 || true
  sudo netfilter-persistent save > /dev/null 2>&1 || true
  log "Porta 3000 liberada"
fi

warn "Lembre-se de liberar a porta 3000 no painel Oracle Cloud:"
warn "  Networking → VCN → Security Lists → Add Ingress Rule → TCP port 3000"

# =============================================================
# 7. PM2 — INICIAR APLICAÇÃO
# =============================================================
step "7/7" "Iniciando aplicação com PM2"

# Para qualquer instância anterior
pm2 stop bolao 2>/dev/null || true
pm2 delete bolao 2>/dev/null || true

info "Iniciando Bolão..."
pm2 start npm --name bolao -- run start -- -H 0.0.0.0

info "Configurando reinício automático no boot..."
# Gera e executa o comando de startup automaticamente
PM2_STARTUP=$(pm2 startup 2>&1 | grep "sudo" | tail -1)
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP" > /dev/null 2>&1
fi
pm2 save > /dev/null 2>&1
log "PM2 configurado para reiniciar no boot"

# =============================================================
# RESUMO FINAL
# =============================================================
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         Deploy concluído com sucesso!    ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "  ${BOLD}URL de acesso:${NC}     http://${IP}:3000"
echo -e "  ${BOLD}Admin:${NC}             http://${IP}:3000/admin"
echo -e "  ${BOLD}Login admin:${NC}       ver ADMIN_EMAIL / ADMIN_PASSWORD no .env.local"
echo ""
echo -e "  ${BOLD}Comandos úteis:${NC}"
echo -e "    pm2 status          → status da aplicação"
echo -e "    pm2 logs bolao      → ver logs em tempo real"
echo -e "    pm2 restart bolao   → reiniciar"
echo ""
pm2 status

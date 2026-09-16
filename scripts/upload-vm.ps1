# =============================================================
# Bolão Copa 2026 — Upload para Oracle Cloud VM
# Uso: .\scripts\upload-vm.ps1 -IP "SEU_IP" -KeyPath "C:\caminho\chave.key"
# =============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$IP,

    [Parameter(Mandatory=$true)]
    [string]$KeyPath,

    [string]$User = "ubuntu",
    [int]$Port = 22
)

$ErrorActionPreference = "Stop"

function Log   { Write-Host "✓ $args" -ForegroundColor Green }
function Info  { Write-Host "→ $args" -ForegroundColor Cyan }
function Warn  { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Step  { Write-Host "`n[$($args[0])] $($args[1])" -ForegroundColor White }

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Bolão Copa 2026 — Upload para VM       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$SshTarget = "${User}@${IP}"
$SshOpts   = "-i `"$KeyPath`" -p $Port -o StrictHostKeyChecking=no"

# =============================================================
Step "1/4" "Fazendo build de produção"
# =============================================================

Info "Rodando npm run build..."
npm run build:next
if ($LASTEXITCODE -ne 0) { throw "Build falhou" }
Log "Build concluído"

# =============================================================
Step "2/4" "Criando pasta na VM"
# =============================================================

Info "Criando ~/bolao na VM..."
Invoke-Expression "ssh $SshOpts $SshTarget 'mkdir -p ~/bolao/scripts ~/bolao/prisma ~/bolao/public'"
Log "Pasta criada"

# =============================================================
Step "3/4" "Enviando arquivos"
# =============================================================

$ScpOpts = "-i `"$KeyPath`" -P $Port -o StrictHostKeyChecking=no"

$files = @(
    @{ Local = ".next";          Remote = "~/bolao/" },
    @{ Local = "public";         Remote = "~/bolao/" },
    @{ Local = "package.json";   Remote = "~/bolao/package.json" },
    @{ Local = "package-lock.json"; Remote = "~/bolao/package-lock.json" },
    @{ Local = "next.config.js"; Remote = "~/bolao/next.config.js" },
    @{ Local = ".env.local";     Remote = "~/bolao/.env.local" },
    @{ Local = "prisma/schema.prisma"; Remote = "~/bolao/prisma/schema.prisma" },
    @{ Local = "prisma/seed.ts"; Remote = "~/bolao/prisma/seed.ts" },
    @{ Local = "scripts/deploy-vm.sh"; Remote = "~/bolao/scripts/deploy-vm.sh" },
    @{ Local = "scripts/sync-poller.mjs"; Remote = "~/bolao/scripts/sync-poller.mjs" }
)

foreach ($f in $files) {
    Info "Enviando $($f.Local)..."
    Invoke-Expression "scp -r $ScpOpts `"$($f.Local)`" `"${SshTarget}:$($f.Remote)`""
}

Log "Todos os arquivos enviados"

# =============================================================
Step "4/4" "Executando deploy na VM"
# =============================================================

Info "Rodando deploy-vm.sh na VM..."
Invoke-Expression "ssh $SshOpts $SshTarget 'cd ~/bolao && bash scripts/deploy-vm.sh'"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            Pronto! Acesse:               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  http://${IP}:3000" -ForegroundColor White
Write-Host "  http://${IP}:3000/admin" -ForegroundColor White
Write-Host ""

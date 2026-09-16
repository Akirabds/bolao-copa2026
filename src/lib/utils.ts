import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, isPast, isBefore } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BRT = 'America/Sao_Paulo'

export function formatDate(date: Date | string, fmt = "dd/MM/yyyy 'às' HH:mm"): string {
  return formatInTimeZone(new Date(date), BRT, fmt, { locale: ptBR })
}

export function formatDateShort(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRT, 'dd/MM', { locale: ptBR })
}

export function formatDateLong(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRT, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), BRT, 'HH:mm', { locale: ptBR })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function isMatchLocked(kickoffAt: Date | string, deadlineAt?: Date | string | null): boolean {
  const deadline = deadlineAt ? new Date(deadlineAt) : new Date(kickoffAt)
  return isPast(deadline)
}

export function canEditPrediction(kickoffAt: Date | string, deadlineAt?: Date | string | null): boolean {
  return !isMatchLocked(kickoffAt, deadlineAt)
}

export function getMatchStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Agendado',
    LIVE: 'Ao Vivo',
    FINISHED: 'Encerrado',
    CANCELLED: 'Cancelado',
    POSTPONED: 'Adiado',
  }
  return labels[status] || status
}

export function getPhaseStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PRE_REGISTRATION: 'Pré-inscrição',
    OPEN_FOR_PAYMENT: 'Aberta para pagamento',
    OPEN_FOR_PREDICTIONS: 'Aberta para palpites',
    CLOSED: 'Encerrada',
    SETTLED: 'Apurada',
    PRIZED: 'Premiada',
  }
  return labels[status] || status
}

export function getPhaseAccessLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pagamento pendente',
    PAYMENT_APPROVED: 'Pagamento aprovado',
    ACCESS_GRANTED: 'Acesso liberado',
    AWAITING_PHASE_RELEASE: 'Aguardando liberação da fase',
    BLOCKED: 'Bloqueado',
    DISQUALIFIED: 'Desclassificado',
  }
  return labels[status] || status
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
    REFUNDED: 'Estornado',
    IN_ANALYSIS: 'Em análise',
  }
  return labels[status] || status
}

export function getPredictionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SAVED: 'Salvo',
    LOCKED: 'Bloqueado',
    SCORED: 'Apurado',
  }
  return labels[status] || status
}

export function ordinal(n: number): string {
  const map: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º' }
  return map[n] || `${n}º`
}

export function getRuleKeyLabel(ruleKey: string): string {
  const labels: Record<string, string> = {
    EXACT: 'Placar exato',
    WINNER_WINNER_GOALS: 'Vencedor + gols do vencedor',
    DRAW: 'Empate acertado',
    WINNER_LOSER_GOALS: 'Vencedor + gols do perdedor',
    WINNER: 'Apenas o vencedor',
    MISS: 'Erro',
  }
  return labels[ruleKey] || ruleKey
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generatePixCode(): string {
  return `00020126580014BR.GOV.BCB.PIX013600000000-0000-0000-0000-000000000000520400005303986540519.905802BR5925BOLAO DA COPA 2026 6009SAO PAULO62070503***6304`
}

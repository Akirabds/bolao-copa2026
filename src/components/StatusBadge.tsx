import { cn } from '@/lib/utils'
import {
  CheckCircle, Clock, XCircle, AlertTriangle, Lock,
  Trophy, Star, Ban, RefreshCw, type LucideProps,
} from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

interface StatusBadgeProps {
  status: string
  type?: 'phase' | 'access' | 'payment' | 'match' | 'prediction'
  size?: 'sm' | 'md'
}

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

const statusConfig: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  // Phase status
  PRE_REGISTRATION:      { label: 'Pré-inscrição',        className: 'badge-gray',   icon: Clock },
  OPEN_FOR_PAYMENT:      { label: 'Aberta p/ pagamento',  className: 'badge-blue',   icon: Star },
  OPEN_FOR_PREDICTIONS:  { label: 'Aberta p/ palpites',   className: 'badge-green',  icon: CheckCircle },
  CLOSED:                { label: 'Encerrada',             className: 'badge-gray',   icon: Lock },
  SETTLED:               { label: 'Apurada',               className: 'badge-gold',   icon: Trophy },
  PRIZED:                { label: 'Premiada',              className: 'badge-gold',   icon: Trophy },
  // Phase access
  PENDING:               { label: 'Pendente',              className: 'badge-orange', icon: Clock },
  PAYMENT_APPROVED:      { label: 'Pagamento aprovado',   className: 'badge-blue',   icon: CheckCircle },
  ACCESS_GRANTED:        { label: 'Acesso liberado',      className: 'badge-green',  icon: CheckCircle },
  AWAITING_PHASE_RELEASE:{ label: 'Aguardando fase',      className: 'badge-orange', icon: Clock },
  BLOCKED:               { label: 'Bloqueado',             className: 'badge-red',    icon: Ban },
  DISQUALIFIED:          { label: 'Desclassificado',      className: 'badge-red',    icon: XCircle },
  // Payment
  APPROVED:              { label: 'Aprovado',              className: 'badge-green',  icon: CheckCircle },
  REJECTED:              { label: 'Recusado',              className: 'badge-red',    icon: XCircle },
  CANCELLED:             { label: 'Cancelado',             className: 'badge-gray',   icon: XCircle },
  EXPIRED:               { label: 'Expirado',              className: 'badge-gray',   icon: Clock },
  REFUNDED:              { label: 'Estornado',             className: 'badge-orange', icon: RefreshCw },
  IN_ANALYSIS:           { label: 'Em análise',            className: 'badge-blue',   icon: AlertTriangle },
  // Match
  SCHEDULED:             { label: 'Agendado',              className: 'badge-gray',   icon: Clock },
  LIVE:                  { label: 'Ao Vivo',               className: 'badge-red',    icon: Star },
  FINISHED:              { label: 'Encerrado',             className: 'badge-gray',   icon: CheckCircle },
  POSTPONED:             { label: 'Adiado',                className: 'badge-orange', icon: AlertTriangle },
  // Prediction
  DRAFT:                 { label: 'Rascunho',              className: 'badge-gray',   icon: Clock },
  SAVED:                 { label: 'Salvo',                 className: 'badge-green',  icon: CheckCircle },
  LOCKED:                { label: 'Bloqueado',             className: 'badge-gray',   icon: Lock },
  SCORED:                { label: 'Apurado',               className: 'badge-gold',   icon: Trophy },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray', icon: AlertTriangle }
  const Icon = config.icon

  return (
    <span className={cn(config.className, size === 'sm' && 'text-xs px-2 py-0.5')}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {config.label}
    </span>
  )
}

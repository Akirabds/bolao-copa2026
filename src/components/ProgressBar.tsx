import { cn } from '@/lib/utils'

interface ProgressBarProps {
  total: number
  filled: number
  locked?: number
  label?: string
  className?: string
}

export function ProgressBar({ total, filled, locked = 0, label, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0
  const missing = total - filled

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{label}</span>
          <span className="font-semibold text-white">{filled}/{total}</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className={cn(percent === 100 ? 'text-brand-400' : '')}>
          {percent}% preenchido
        </span>
        {missing > 0 && (
          <span className="text-orange-400">{missing} faltam</span>
        )}
        {locked > 0 && (
          <span className="text-slate-500">{locked} bloqueados</span>
        )}
      </div>
    </div>
  )
}

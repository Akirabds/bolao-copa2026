'use client'

import { useState, useCallback } from 'react'
import { cn, formatDate, formatTime, isMatchLocked } from '@/lib/utils'
import { Lock, CheckCircle, Clock, Trophy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Converte emoji de bandeira (ex: 🇧🇷) em código de país (ex: "br")
function emojiToCode(emoji: string): string {
  const pts = Array.from(emoji).map(c => c.codePointAt(0) ?? 0).filter(n => n >= 0x1F1E6 && n <= 0x1F1FF)
  if (pts.length < 2) return ''
  return pts.map(n => String.fromCharCode(n - 0x1F1E6 + 65)).join('').toLowerCase()
}

function FlagImg({ emoji, alt }: { emoji?: string | null; alt: string }) {
  const code = emoji ? emojiToCode(emoji) : ''
  if (!code) return <span className="text-3xl leading-none">🏳️</span>
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      alt={alt}
      width={48}
      height={32}
      className="rounded object-cover"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

interface Match {
  id: string
  selection1: string
  selection2: string
  flag1?: string | null
  flag2?: string | null
  kickoffAt: string
  location?: string | null
  stadium?: string | null
  groupCode?: string | null
  roundLabel?: string | null
  matchStatus: string
  officialScore1?: number | null
  officialScore2?: number | null
  predictionDeadlineAt?: string | null
}

interface Prediction {
  id?: string
  predictedScore1: number
  predictedScore2: number
  status: string
  pointsAwarded?: number | null
  exactScoreHit?: boolean | null
  outcomeHit?: boolean | null
  scoringDetail?: string | null
}

interface MatchCardProps {
  match: Match
  prediction?: Prediction | null
  phaseId: string
  onSaved?: () => void
  canPredict?: boolean
}

export function MatchCard({ match, prediction, phaseId, onSaved, canPredict = true }: MatchCardProps) {
  const locked = isMatchLocked(match.kickoffAt, match.predictionDeadlineAt)
  const finished = match.matchStatus === 'FINISHED'
  const live = match.matchStatus === 'LIVE'

  const [score1, setScore1] = useState<string>(
    prediction ? String(prediction.predictedScore1) : ''
  )
  const [score2, setScore2] = useState<string>(
    prediction ? String(prediction.predictedScore2) : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!prediction)
  const [dirty, setDirty] = useState(false)

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setter(v)
    setDirty(true)
    setSaved(false)
  }

  const handleSave = useCallback(async () => {
    if (score1 === '' || score2 === '') {
      toast.error('Preencha os dois placares')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          phaseId,
          predictedScore1: parseInt(score1),
          predictedScore2: parseInt(score2),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setDirty(false)
        toast.success('Palpite salvo!')
        onSaved?.()
      } else {
        toast.error(data.error || 'Erro ao salvar palpite')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }, [match.id, phaseId, score1, score2, onSaved])

  // Status visual do card
  const cardStatus = finished && prediction?.status === 'SCORED'
    ? 'scored'
    : locked
    ? 'locked'
    : saved && !dirty
    ? 'saved'
    : 'open'

  const borderColor = {
    scored: prediction?.exactScoreHit ? 'border-gold-500/60' : prediction?.outcomeHit ? 'border-brand-500/40' : 'border-[#2a3147]',
    locked: 'border-[#2a3147]',
    saved: 'border-brand-600/40',
    open: 'border-[#2a3147] hover:border-brand-600/30',
  }[cardStatus]

  return (
    <div className={cn('card p-4 transition-all duration-200', borderColor)}>
      {/* Header: grupo/rodada + data */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
        <span className="font-medium">
          {match.groupCode ? `Grupo ${match.groupCode}` : match.roundLabel || 'Mata-Mata'}
        </span>
        <div className="flex items-center gap-3">
          {live && (
            <span className="flex items-center gap-1 text-red-400 font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              AO VIVO
            </span>
          )}
          <span>{formatDate(match.kickoffAt, "dd/MM 'às' HH:mm")}</span>
        </div>
      </div>

      {/* Confronto */}
      <div className="flex items-center gap-3 mb-4">
        {/* Seleção 1 */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          <FlagImg emoji={match.flag1} alt={match.selection1} />
          <span className="text-sm font-semibold text-slate-200 leading-tight">{match.selection1}</span>
        </div>

        {/* Placar no centro */}
        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          {finished && match.officialScore1 !== null && match.officialScore2 !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{match.officialScore1}</span>
              <span className="text-slate-500 text-lg">×</span>
              <span className="text-2xl font-bold text-white">{match.officialScore2}</span>
            </div>
          ) : (
            <span className="text-slate-600 text-sm font-medium">
              {locked ? 'Bloqueado' : 'Palpite'}
            </span>
          )}
          {finished && (
            <span className="text-xs text-slate-500">Resultado oficial</span>
          )}
        </div>

        {/* Seleção 2 */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          <FlagImg emoji={match.flag2} alt={match.selection2} />
          <span className="text-sm font-semibold text-slate-200 leading-tight">{match.selection2}</span>
        </div>
      </div>

      {/* Área de palpite */}
      {canPredict && (
        <div className="border-t border-[#2a3147] pt-4">
          {locked ? (
            <LockedPrediction prediction={prediction} />
          ) : (
            <OpenPrediction
              score1={score1}
              score2={score2}
              onScore1={handleChange(setScore1)}
              onScore2={handleChange(setScore2)}
              onSave={handleSave}
              saving={saving}
              saved={saved && !dirty}
              hasPrediction={!!prediction}
            />
          )}
        </div>
      )}

      {/* Local */}
      {match.location && (
        <p className="text-xs text-slate-600 text-center mt-3 truncate">
          📍 {match.stadium ? `${match.stadium} — ` : ''}{match.location}
        </p>
      )}
    </div>
  )
}

function LockedPrediction({ prediction }: { prediction?: Prediction | null }) {
  if (!prediction) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-1">
        <Lock size={14} />
        <span>Palpite não registrado</span>
      </div>
    )
  }

  const scored = prediction.status === 'SCORED'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Lock size={14} className="text-slate-500" />
        <span className="font-semibold text-white">
          {prediction.predictedScore1} × {prediction.predictedScore2}
        </span>
        <span className="text-slate-500">seu palpite</span>
      </div>

      {scored && prediction.pointsAwarded !== undefined && prediction.pointsAwarded !== null && (
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold',
          prediction.exactScoreHit
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
            : prediction.outcomeHit
            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
        )}>
          {prediction.exactScoreHit && <Trophy size={13} />}
          +{prediction.pointsAwarded} pts
        </div>
      )}

      {!scored && (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock size={12} />
          Aguardando resultado
        </span>
      )}
    </div>
  )
}

interface OpenPredictionProps {
  score1: string
  score2: string
  onScore1: (e: React.ChangeEvent<HTMLInputElement>) => void
  onScore2: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  saving: boolean
  saved: boolean
  hasPrediction: boolean
}

function OpenPrediction({ score1, score2, onScore1, onScore2, onSave, saving, saved, hasPrediction }: OpenPredictionProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex items-center justify-end gap-2">
        <input
          type="number"
          min={0}
          max={99}
          value={score1}
          onChange={onScore1}
          placeholder="0"
          className="score-input"
          aria-label="Gols seleção 1"
        />
      </div>

      <span className="text-slate-500 font-bold text-xl">×</span>

      <div className="flex-1 flex items-center justify-start gap-2">
        <input
          type="number"
          min={0}
          max={99}
          value={score2}
          onChange={onScore2}
          placeholder="0"
          className="score-input"
          aria-label="Gols seleção 2"
        />
      </div>

      <button
        onClick={onSave}
        disabled={saving || score1 === '' || score2 === ''}
        className={cn(
          'btn text-sm px-4 py-2 min-w-[80px]',
          saved
            ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
            : 'btn-primary'
        )}
      >
        {saving ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Salvando
          </span>
        ) : saved ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle size={14} />
            Salvo
          </span>
        ) : (
          hasPrediction ? 'Atualizar' : 'Salvar'
        )}
      </button>
    </div>
  )
}

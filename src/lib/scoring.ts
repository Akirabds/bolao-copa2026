// ============================================================
// MOTOR DE PONTUAÇÃO — BOLÃO DA COPA 2026
// ============================================================

export type ScoreRuleKey =
  | 'EXACT'
  | 'WINNER'
  | 'MISS'

export interface ScoreResult {
  points: number
  ruleKey: ScoreRuleKey
  exactScoreHit: boolean
  outcomeHit: boolean
  detail: string
}

// Configuração padrão (sobreposta pelas regras do DB)
const DEFAULT_RULES: Record<ScoreRuleKey, number> = {
  EXACT: 30,
  WINNER: 15,
  MISS: 0,
}

type Outcome = 'TEAM1' | 'TEAM2' | 'DRAW'

function getOutcome(score1: number, score2: number): Outcome {
  if (score1 > score2) return 'TEAM1'
  if (score2 > score1) return 'TEAM2'
  return 'DRAW'
}

export function calculateScore(
  official1: number,
  official2: number,
  predicted1: number,
  predicted2: number,
  rules: Partial<Record<ScoreRuleKey, number>> = {}
): ScoreResult {
  const pts = { ...DEFAULT_RULES, ...rules }

  const officialOutcome  = getOutcome(official1, official2)
  const predictedOutcome = getOutcome(predicted1, predicted2)
  const exactScore = official1 === predicted1 && official2 === predicted2
  const outcomeHit = officialOutcome === predictedOutcome

  // 1. Placar exato → 30 pts
  if (exactScore) {
    return {
      points: pts.EXACT,
      ruleKey: 'EXACT',
      exactScoreHit: true,
      outcomeHit: true,
      detail: `Placar exato ${official1}x${official2} (+${pts.EXACT} pts)`,
    }
  }

  // 2. Acertou o vencedor/empate → 15 pts
  if (outcomeHit) {
    return {
      points: pts.WINNER,
      ruleKey: 'WINNER',
      exactScoreHit: false,
      outcomeHit: true,
      detail: `Vencedor/empate correto (+${pts.WINNER} pts)`,
    }
  }

  // 3. Errou → 0 pts
  return {
    points: pts.MISS,
    ruleKey: 'MISS',
    exactScoreHit: false,
    outcomeHit: false,
    detail: 'Palpite incorreto (0 pts)',
  }
}

// ============================================================
// UTILITÁRIOS DE RANKING
// ============================================================

export interface RankingEntry {
  userId: string
  totalPoints: number
  exactScores: number
  outcomeHits: number
  lastPredictionAt: Date | null
}

/**
 * Ordena participantes aplicando critérios de desempate configuráveis.
 * Padrão: pontos → placares exatos → acertos de resultado → data mais antiga
 */
export function sortRanking(
  entries: RankingEntry[],
  tiebreakOrder: string[] = ['totalPoints', 'exactScores', 'outcomeHits', 'lastPredictionAt']
): RankingEntry[] {
  return [...entries].sort((a, b) => {
    for (const criterion of tiebreakOrder) {
      if (criterion === 'totalPoints') {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      } else if (criterion === 'exactScores') {
        if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores
      } else if (criterion === 'outcomeHits') {
        if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits
      } else if (criterion === 'lastPredictionAt') {
        // Data mais antiga tem prioridade (enviou palpites primeiro)
        const aTime = a.lastPredictionAt?.getTime() ?? Infinity
        const bTime = b.lastPredictionAt?.getTime() ?? Infinity
        if (aTime !== bTime) return aTime - bTime
      }
    }
    return 0
  })
}

/**
 * Atribui posições respeitando empates reais (mesmo position para pontuações idênticas)
 */
export function assignPositions(sorted: RankingEntry[]): (RankingEntry & { position: number })[] {
  return sorted.map((entry, idx, arr) => {
    if (idx === 0) return { ...entry, position: 1 }
    const prev = arr[idx - 1] as RankingEntry & { position: number }
    const tied =
      prev.totalPoints === entry.totalPoints &&
      prev.exactScores === entry.exactScores &&
      prev.outcomeHits === entry.outcomeHits &&
      prev.lastPredictionAt?.getTime() === entry.lastPredictionAt?.getTime()
    return { ...entry, position: tied ? (prev as any).position : idx + 1 }
  })
}

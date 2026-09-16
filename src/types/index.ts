// ============================================================
// TIPOS CENTRALIZADOS — BOLÃO DA COPA 2026
// ============================================================

export type Role = 'PARTICIPANT' | 'ADMIN'

export type PhaseStatus =
  | 'PRE_REGISTRATION'
  | 'OPEN_FOR_PAYMENT'
  | 'OPEN_FOR_PREDICTIONS'
  | 'CLOSED'
  | 'SETTLED'
  | 'PRIZED'

export type PhaseAccessStatus =
  | 'PENDING'
  | 'PAYMENT_APPROVED'
  | 'ACCESS_GRANTED'
  | 'AWAITING_PHASE_RELEASE'
  | 'BLOCKED'
  | 'DISQUALIFIED'

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED'

export type PredictionStatus = 'DRAFT' | 'SAVED' | 'LOCKED' | 'SCORED'

export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'IN_ANALYSIS'

export type PrizeStatus = 'PENDING' | 'CONFIRMED' | 'PAID'

// ============================================================
// ENTIDADES
// ============================================================

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  cpf?: string | null
  role: Role
  isActive: boolean
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Phase {
  id: string
  name: string
  slug: string
  type: 'GROUP_STAGE' | 'KNOCKOUT'
  entryFee: number
  status: PhaseStatus
  openedAt?: Date | null
  closedAt?: Date | null
  settledAt?: Date | null
  description?: string | null
  createdAt: Date
}

export interface PhaseAccess {
  id: string
  userId: string
  phaseId: string
  status: PhaseAccessStatus
  grantedAt?: Date | null
  createdAt: Date
}

export interface Match {
  id: string
  phaseId: string
  groupCode?: string | null
  matchday?: number | null
  roundLabel?: string | null
  selection1: string
  selection2: string
  flag1?: string | null
  flag2?: string | null
  kickoffAt: Date
  location?: string | null
  stadium?: string | null
  matchStatus: MatchStatus
  officialScore1?: number | null
  officialScore2?: number | null
  resultConfirmedAt?: Date | null
  predictionDeadlineAt?: Date | null
  sortOrder: number
}

export interface Prediction {
  id: string
  userId: string
  matchId: string
  phaseId: string
  predictedScore1: number
  predictedScore2: number
  submittedAt: Date
  updatedAt: Date
  lockedAt?: Date | null
  status: PredictionStatus
  pointsAwarded?: number | null
  exactScoreHit?: boolean | null
  outcomeHit?: boolean | null
  scoringDetail?: string | null
}

export interface Payment {
  id: string
  userId: string
  phaseId: string
  amount: number
  gateway: string
  gatewayReference?: string | null
  status: PaymentStatus
  paidAt?: Date | null
  createdAt: Date
}

export interface Ranking {
  id: string
  userId: string
  phaseId: string
  position?: number | null
  totalPoints: number
  exactScores: number
  outcomeHits: number
  predictionsCount: number
  lastPredictionAt?: Date | null
  updatedAt: Date
  user?: Pick<User, 'id' | 'name' | 'email'>
}

// ============================================================
// DTOs / PAYLOADS DA API
// ============================================================

export interface RegisterPayload {
  name: string
  email: string
  phone?: string
  cpf?: string
  password: string
  acceptTerms: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface PredictionPayload {
  matchId: string
  phaseId: string
  predictedScore1: number
  predictedScore2: number
}

export interface SetResultPayload {
  matchId: string
  score1: number
  score2: number
  notes?: string
}

// ============================================================
// RESPOSTAS DA API
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// DASHBOARD / ESTATÍSTICAS
// ============================================================

export interface DashboardStats {
  totalUsers: number
  phase1Users: number
  phase2Users: number
  pendingPayments: number
  totalRevenue: number
  phase1Revenue: number
  phase2Revenue: number
  totalPredictions: number
  phase1Prize: number
  phase2Prize: number
}

export interface ParticipantDashboard {
  user: User
  phase1Access?: PhaseAccess | null
  phase2Access?: PhaseAccess | null
  phase1Payment?: Payment | null
  phase2Payment?: Payment | null
  phase1Ranking?: Ranking | null
  phase2Ranking?: Ranking | null
  phase1Progress: { total: number; filled: number; locked: number }
  phase2Progress: { total: number; filled: number; locked: number }
}

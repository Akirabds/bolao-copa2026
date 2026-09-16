// football-data.org API v4 client para Copa do Mundo 2026
// Plano gratuito: 10 req/min — https://www.football-data.org/client/register

const BASE_URL = 'https://api.football-data.org/v4'
const COMPETITION = 'WC'

// Mapeia nomes em inglês da API → nomes em português do nosso DB
export const TEAM_NAME_MAP: Record<string, string> = {
  // Grupo A
  'Mexico': 'México',
  'South Africa': 'África do Sul',
  'South Korea': 'Coreia do Sul',
  'Korea Republic': 'Coreia do Sul',
  'Czech Republic': 'Rep. Tcheca',
  'Czechia': 'Rep. Tcheca',
  // Grupo B
  'Canada': 'Canadá',
  'Bosnia and Herzegovina': 'Bósnia',
  'Bosnia-Herzegovina': 'Bósnia',
  'Qatar': 'Catar',
  'Switzerland': 'Suíça',
  // Grupo C
  'Brazil': 'Brasil',
  'Morocco': 'Marrocos',
  'Haiti': 'Haiti',
  'Scotland': 'Escócia',
  // Grupo D
  'United States': 'EUA',
  'USA': 'EUA',
  'Paraguay': 'Paraguai',
  'Australia': 'Austrália',
  'Turkey': 'Turquia',
  'Türkiye': 'Turquia',
  // Grupo E
  'Germany': 'Alemanha',
  'Curaçao': 'Curaçao',
  'Curacao': 'Curaçao',
  "Ivory Coast": 'Costa do Marfim',
  "Côte d'Ivoire": 'Costa do Marfim',
  'Ecuador': 'Equador',
  // Grupo F
  'Netherlands': 'Holanda',
  'Japan': 'Japão',
  'Sweden': 'Suécia',
  'Tunisia': 'Tunísia',
  // Grupo G
  'Belgium': 'Bélgica',
  'Egypt': 'Egito',
  'Iran': 'Irã',
  'IR Iran': 'Irã',
  'New Zealand': 'Nova Zelândia',
  // Grupo H
  'Spain': 'Espanha',
  'Cape Verde': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde',
  'Saudi Arabia': 'Arábia Saudita',
  'Uruguay': 'Uruguai',
  // Grupo I
  'France': 'França',
  'Senegal': 'Senegal',
  'Iraq': 'Iraque',
  'Norway': 'Noruega',
  // Grupo J
  'Argentina': 'Argentina',
  'Algeria': 'Argélia',
  'Austria': 'Áustria',
  'Jordan': 'Jordânia',
  // Grupo K
  'Portugal': 'Portugal',
  'DR Congo': 'Congo',
  'Congo DR': 'Congo',
  'Congo': 'Congo',
  'Democratic Republic of Congo': 'Congo',
  'Uzbekistan': 'Uzbequistão',
  'Colombia': 'Colômbia',
  // Grupo L
  'England': 'Inglaterra',
  'Croatia': 'Croácia',
  'Ghana': 'Gana',
  'Panama': 'Panamá',
}

export function normalizeTeamName(apiName: string | null): string {
  if (!apiName) return ''
  return TEAM_NAME_MAP[apiName] ?? apiName
}

// Statuses da football-data.org
export type FDMatchStatus =
  | 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED'
  | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED'

export interface FDMatch {
  id: number
  utcDate: string
  status: FDMatchStatus
  matchday: number | null
  stage: string
  group: string | null
  homeTeam: { id: number | null; name: string | null; shortName: string | null }
  awayTeam: { id: number | null; name: string | null; shortName: string | null }
  score: {
    winner: string | null
    duration: string
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

interface FDResponse {
  resultSet?: { count: number }
  matches: FDMatch[]
}

function apiHeaders() {
  return { 'X-Auth-Token': process.env.FOOTBALL_API_KEY ?? '' }
}

export function mapFDStatus(status: FDMatchStatus): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' {
  if (['IN_PLAY', 'PAUSED'].includes(status)) return 'LIVE'
  if (['FINISHED'].includes(status)) return 'FINISHED'
  if (['POSTPONED', 'SUSPENDED', 'CANCELLED'].includes(status)) return 'POSTPONED'
  return 'SCHEDULED'
}

async function fetchMatches(params: Record<string, string>): Promise<FDMatch[]> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE_URL}/competitions/${COMPETITION}/matches?${qs}`, {
    headers: apiHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`football-data.org ${res.status}: ${text}`)
  }
  const data: FDResponse = await res.json()
  return data.matches ?? []
}

export async function fetchLiveMatches(): Promise<FDMatch[]> {
  return fetchMatches({ status: 'IN_PLAY' })
}

export async function fetchTodayMatches(): Promise<FDMatch[]> {
  const today = new Date().toISOString().split('T')[0]
  return fetchMatches({ dateFrom: today, dateTo: today })
}

export async function fetchMatchesForSync(): Promise<FDMatch[]> {
  const today = new Date().toISOString().split('T')[0]

  // Busca jogos de hoje + ao vivo em paralelo (2 requests)
  const [live, todayMatches] = await Promise.all([
    fetchLiveMatches().catch(() => [] as FDMatch[]),
    fetchTodayMatches().catch(() => [] as FDMatch[]),
  ])

  // Deduplica por ID
  const map = new Map<number, FDMatch>()
  for (const m of [...todayMatches, ...live]) map.set(m.id, m)
  return Array.from(map.values())
}

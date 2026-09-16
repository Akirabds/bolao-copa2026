import webpush from 'web-push'
import { PrismaClient } from '@prisma/client'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

interface MatchPushPayload {
  selection1: string
  selection2: string
  status: 'LIVE' | 'FINISHED'
  score1?: number | null
  score2?: number | null
}

export async function sendMatchPush(prisma: PrismaClient, match: MatchPushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany()
  if (subscriptions.length === 0) return

  let title: string
  let body: string

  if (match.status === 'LIVE') {
    title = `Apito inicial! ⚽`
    body = `${match.selection1} × ${match.selection2} — jogo começou!`
  } else {
    const score = match.score1 !== null && match.score2 !== null
      ? ` — ${match.score1}×${match.score2}`
      : ''
    title = `Fim de jogo!`
    body = `${match.selection1} × ${match.selection2}${score}`
  }

  const payload = JSON.stringify({ title, body, tag: `match-${match.status}`, url: '/fase/fase1' })

  const dead: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          dead.push(sub.endpoint)
        }
      }
    })
  )

  if (dead.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: dead } } })
  }
}

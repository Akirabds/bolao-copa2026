const BASE_URL = 'https://api.checkout.infinitepay.io'
const HANDLE = process.env.INFINITEPAY_HANDLE!

function amountInCents(value: number) {
  return Math.round(value * 100)
}

export interface CheckoutResult {
  checkoutId: string
  paymentUrl: string
}

export async function createCheckout(
  paymentId: string,
  amount: number,
  description: string,
  redirectUrl: string,
  webhookUrl: string,
): Promise<CheckoutResult> {
  const body = {
    handle: HANDLE,
    order_nsu: `bolao-${paymentId}`,
    items: [{ quantity: 1, price: amountInCents(amount), description }],
    redirect_url: redirectUrl,
    webhook_url: webhookUrl,
  }

  const res = await fetch(`${BASE_URL}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? `InfinityPay error ${res.status}`)
  }

  const paymentUrl = data.payment_url ?? data.url ?? data.link ?? data.checkout_url ?? ''
  if (!paymentUrl) throw new Error(`InfinityPay não retornou URL: ${JSON.stringify(data)}`)

  return {
    checkoutId: data.order_nsu ?? `bolao-${paymentId}`,
    paymentUrl,
  }
}

export async function checkPayment(
  orderNsu: string,
  transactionNsu: string,
  slug: string,
): Promise<{ paid: boolean; status: string }> {
  const body = {
    handle: HANDLE,
    order_nsu: orderNsu,
    transaction_nsu: transactionNsu,
    slug,
  }

  const res = await fetch(`${BASE_URL}/payment_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) return { paid: false, status: 'error' }

  const status = data?.status ?? data?.capture_method ?? ''
  const paid = data?.paid === true || ['approved', 'paid', 'pix', 'credit_card'].includes(status?.toLowerCase())

  return { paid, status }
}

const BASE_URL =
  process.env.PAGBANK_ENV === 'production'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com'

const TOKEN = process.env.PAGBANK_TOKEN!

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }
}

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
  customer: { name: string; email: string; cpf?: string | null },
  redirectUrl: string,
): Promise<CheckoutResult> {
  const body = {
    reference_id: `bolao-${paymentId}`,
    customer: {
      name: customer.name,
      email: customer.email,
      ...(customer.cpf ? { tax_id: customer.cpf.replace(/\D/g, '') } : {}),
    },
    items: [{
      reference_id: paymentId,
      name: description,
      quantity: 1,
      unit_amount: amountInCents(amount),
    }],
    payment_methods: [
      { type: 'PIX' },
      { type: 'CREDIT_CARD' },
      { type: 'DEBIT_CARD' },
      { type: 'BOLETO' },
    ],
    payment_methods_configs: [{
      type: 'CREDIT_CARD',
      config_options: [{ option: 'INSTALLMENTS_LIMIT', value: '1' }],
    }],
    redirect_url: redirectUrl,
    expiration_date: (() => {
      const d = new Date()
      d.setHours(d.getHours() + 24)
      return d.toISOString().slice(0, 19) + '-03:00'
    })(),
  }

  const res = await fetch(`${BASE_URL}/checkouts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error_messages?.[0]?.description ?? data?.message ?? `PagBank error ${res.status}`)
  }

  const paymentUrl = data.payment_url ?? data.links?.find((l: any) => l.rel === 'PAY')?.href ?? ''

  return {
    checkoutId: data.id,
    paymentUrl,
  }
}

export async function getCheckout(checkoutId: string) {
  const res = await fetch(`${BASE_URL}/checkouts/${checkoutId}`, { headers: headers() })
  return res.json()
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers: headers() })
  return res.json()
}

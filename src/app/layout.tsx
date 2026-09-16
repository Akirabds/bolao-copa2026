import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Bolão da Copa 2026', template: '%s | Bolão da Copa 2026' },
  description: 'O melhor bolão da Copa do Mundo 2026. Faça seus palpites, dispute com amigos e concorra a prêmios.',
  keywords: ['bolão', 'copa do mundo', '2026', 'palpites', 'futebol'],
  openGraph: {
    title: 'Bolão da Copa 2026',
    description: 'Faça seus palpites e concorra a prêmios na Copa do Mundo 2026!',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-[#0f1117]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e2433', border: '1px solid #2a3147', color: '#e8eaf0' },
          }}
        />
      </body>
    </html>
  )
}

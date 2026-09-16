import Link from 'next/link'
import { Trophy, Target, Star, ChevronRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Nav pública */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a3147] bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/40">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Bolão da Copa</span>
              <span className="text-brand-400 font-bold text-sm"> 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn-sm text-slate-300">Entrar</Link>
            <Link href="/cadastro" className="btn-primary btn-sm">Participar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-600/40 text-brand-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Trophy size={14} />
            Copa do Mundo FIFA 2026
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            O maior bolão da{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-300">
              Copa 2026
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Fase 1 gratuita para todos! Faça seus palpites, acompanhe o ranking em tempo real e concorra a prêmios na Fase 2.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/cadastro" className="btn-gold btn-lg text-base font-bold shadow-xl shadow-gold-900/30">
              <Trophy size={20} />
              Participar agora — Grátis
              <ChevronRight size={20} />
            </Link>
            <Link href="/regulamento" className="btn-secondary btn-lg text-slate-300">
              Ver regulamento
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
            {[
              { label: '48 seleções', sub: 'participando' },
              { label: '104 partidas', sub: 'para palpitar' },
              { label: 'Fase 1', sub: 'gratuita para todos' },
            ].map(({ label, sub }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{label}</p>
                <p className="text-slate-500 text-sm">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fases */}
      <section className="py-20 px-4 border-t border-[#2a3147]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Como funciona</h2>
            <p className="text-slate-400">Duas fases independentes, duas chances de ganhar</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Fase 1 */}
            <div className="card p-6 border-brand-600/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-600/40 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-300">
                    <Target size={15} />
                    Fase 1
                  </div>
                  <span className="text-3xl font-bold text-brand-400">Grátis</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fase de Grupos</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Palpite em todas as 72 partidas da fase de grupos. Acesso gratuito para todos os cadastrados.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {['72 partidas para palpitar', '12 grupos com 4 seleções', 'Acesso imediato ao se cadastrar', 'Editar até o início de cada jogo'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-brand-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 p-3 bg-surface-50 rounded-lg text-xs text-slate-400">
                  <span className="font-semibold text-white">Sem premiação — </span>
                  fase gratuita e aberta a todos
                </div>
              </div>
            </div>

            {/* Fase 2 */}
            <div className="card p-6 border-gold-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/40 rounded-lg px-3 py-1.5 text-sm font-semibold text-gold-300">
                    <Star size={15} />
                    Fase 2
                  </div>
                  <span className="text-3xl font-bold text-gold-400">R$ 10,00</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mata-Mata</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Palpite nos jogos eliminatórios: oitavas, quartas, semifinais e final. O 1º colocado leva tudo!
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {['32 partidas eliminatórias', 'Oitavas, Quartas, Semis e Final', '1 premiado (1º lugar leva tudo)', 'Pode pagar antecipadamente'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-gold-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 p-3 bg-surface-50 rounded-lg text-xs text-slate-400">
                  <span className="font-semibold text-white">Liberação: </span>
                  Palpites disponíveis após encerramento da Fase 1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pontuação */}
      <section className="py-20 px-4 bg-surface-card border-y border-[#2a3147]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Sistema de Pontuação</h2>
            <p className="text-slate-400">Quanto mais preciso seu palpite, mais pontos você ganha</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { pts: 30, label: 'Placar exato', color: 'border-gold-500/50 bg-gold-500/10', textColor: 'text-gold-400', desc: 'Palpitou 2×1 e o resultado foi 2×1' },
              { pts: 15, label: 'Vencedor / Empate', color: 'border-brand-500/50 bg-brand-500/10', textColor: 'text-brand-400', desc: 'Acertou quem ganhou ou que empatou' },
              { pts: 0,  label: 'Palpite errado', color: 'border-red-500/30 bg-red-500/5', textColor: 'text-red-400', desc: 'Errou o resultado' },
            ].map(({ pts, label, color, textColor, desc }) => (
              <div key={label} className={`rounded-xl p-4 border ${color}`}>
                <div className={`text-3xl font-bold ${textColor} mb-1`}>{pts} pts</div>
                <div className="text-sm font-semibold text-white mb-1">{label}</div>
                <div className="text-xs text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Perguntas frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'A Fase 1 é mesmo gratuita?', a: 'Sim! Basta criar sua conta para ter acesso imediato aos palpites da Fase 1 (fase de grupos), sem nenhum custo. A Fase 2 (mata-mata) é paga e custa R$ 10,00.' },
              { q: 'Posso pagar a Fase 2 antes da Fase 1 terminar?', a: 'Sim! Você pode garantir sua vaga na Fase 2 antecipadamente. Os palpites do mata-mata serão liberados quando a Fase 1 encerrar oficialmente.' },
              { q: 'Posso editar meu palpite depois de salvar?', a: 'Sim, até o início de cada partida. Assim que o jogo começar, o palpite é bloqueado automaticamente.' },
              { q: 'Como funciona o desempate?', a: 'O critério de desempate é: 1º maior pontuação, 2º mais placares exatos, 3º mais acertos de resultado, 4º data mais antiga do último palpite.' },
              { q: 'Como recebo meu prêmio?', a: 'Após o encerramento de cada fase, o administrador apura o resultado e entra em contato com os vencedores para realizar o pagamento via PIX.' },
            ].map(({ q, a }) => (
              <details key={q} className="card group">
                <summary className="p-4 cursor-pointer font-medium text-slate-200 hover:text-white flex items-center justify-between list-none">
                  {q}
                  <ChevronRight size={16} className="text-slate-500 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 border-t border-[#2a3147]">
        <div className="max-w-2xl mx-auto text-center">
          <Trophy size={40} className="mx-auto text-gold-400 mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Pronto para competir?</h2>
          <p className="text-slate-400 mb-8">Cadastre-se grátis e dispute a Fase 1 com seus amigos. Para a Fase 2 com premiação, é só R$ 10,00!</p>
          <Link href="/cadastro" className="btn-gold btn-lg text-base font-bold inline-flex shadow-xl shadow-gold-900/30">
            <Trophy size={20} />
            Cadastrar grátis
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a3147] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-brand-500" />
            <span>Bolão da Copa 2026</span>
          </div>
          <div className="flex gap-4">
            <Link href="/regulamento" className="hover:text-slate-300 transition-colors">Regulamento</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Entrar</Link>
            <Link href="/cadastro" className="hover:text-slate-300 transition-colors">Cadastro</Link>
          </div>
          <p>© 2026 Bolão da Copa. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { Trophy, ChevronLeft } from 'lucide-react'

export const metadata = { title: 'Regulamento' }

export default function RegulamentoPage() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="sticky top-0 z-40 bg-surface-card border-b border-[#2a3147]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-brand-400" />
            <span className="font-semibold text-white text-sm">Regulamento</span>
          </div>
          <Link href="/cadastro" className="btn-primary btn-sm">Participar</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Regulamento Oficial</h1>
          <p className="text-slate-400">Bolão da Copa do Mundo 2026 — Versão 1.0</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          {sections.map(({ title, content }) => (
            <section key={title} className="card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-brand-500 rounded-full" />
                {title}
              </h2>
              <div className="space-y-2 text-sm">{content}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/cadastro" className="btn-primary btn-lg inline-flex">
            <Trophy size={18} />
            Participar do Bolão
          </Link>
        </div>
      </div>
    </div>
  )
}

const sections = [
  {
    title: '1. Definição e Objetivo',
    content: (
      <>
        <p>1.1. O Bolão da Copa 2026 é uma competição de palpites sobre os resultados dos jogos da Copa do Mundo FIFA 2026, realizada nos Estados Unidos, Canadá e México.</p>
        <p>1.2. O objetivo é acumular mais pontos que os demais participantes por meio da precisão nos palpites de cada partida.</p>
        <p>1.3. O bolão é dividido em duas fases independentes: Fase 1 (Grupos) e Fase 2 (Mata-Mata).</p>
      </>
    ),
  },
  {
    title: '2. Participação e Inscrição',
    content: (
      <>
        <p>2.1. A participação na <strong className="text-white">Fase 1 (Grupos) é gratuita</strong> — basta realizar o cadastro para ter acesso imediato aos palpites.</p>
        <p>2.2. A <strong className="text-white">Fase 2 (Mata-Mata)</strong> é paga e independente da Fase 1. O valor de participação é de <strong>R$ 10,00</strong>.</p>
        <p>2.3. O participante pode pagar a Fase 2 antecipadamente, porém os palpites só serão liberados após o encerramento oficial da Fase 1.</p>
        <p>2.4. O acesso à Fase 2 é liberado somente após a confirmação do pagamento pelo administrador.</p>
      </>
    ),
  },
  {
    title: '3. Palpites',
    content: (
      <>
        <p>3.1. O participante deve informar o placar (número de gols de cada seleção) para cada partida da(s) fase(s) em que participa.</p>
        <p>3.2. Palpites podem ser criados, editados e salvos até o início de cada partida.</p>
        <p>3.3. Após o início de uma partida, o palpite daquela partida é bloqueado automaticamente e não pode mais ser alterado.</p>
        <p>3.4. Cada partida possui um prazo de fechamento definido (normalmente o horário de início do jogo).</p>
        <p>3.5. Partidas sem palpite registrado antes do bloqueio receberão 0 pontos.</p>
        <p>3.6. A Fase 2 só aceita palpites quando: (a) o pagamento da Fase 2 está aprovado; E (b) a Fase 1 está oficialmente encerrada.</p>
      </>
    ),
  },
  {
    title: '4. Sistema de Pontuação',
    content: (
      <>
        <p>4.1. A pontuação de cada palpite segue a seguinte tabela:</p>
        <ul className="ml-4 mt-2 space-y-1 list-disc text-slate-400">
          <li><strong className="text-white">30 pontos</strong> — Placar exato (ex.: palpitou 2×1, resultado foi 2×1)</li>
          <li><strong className="text-white">15 pontos</strong> — Acertou o vencedor ou o empate (placar diferente)</li>
          <li><strong className="text-white">0 pontos</strong> — Errou o resultado</li>
        </ul>
        <p className="mt-2">4.2. Em jogos do mata-mata, considera-se apenas o resultado até o fim do tempo regulamentar.</p>
        <p>4.3. Pênaltis não entram no cálculo da pontuação.</p>
      </>
    ),
  },
  {
    title: '5. Desempate',
    content: (
      <>
        <p>Em caso de empate na pontuação, os critérios de desempate são aplicados na seguinte ordem:</p>
        <ol className="ml-4 mt-2 space-y-1 list-decimal text-slate-400">
          <li>Maior número de placares exatos (30 pts)</li>
          <li>Maior número de acertos de vencedor/empate</li>
          <li>Data e hora mais antiga do último palpite válido</li>
          <li>Decisão manual pelo administrador, se necessário</li>
        </ol>
      </>
    ),
  },
  {
    title: '6. Premiação',
    content: (
      <>
        <p>6.1. A <strong className="text-white">Fase 1 (Grupos) não possui premiação</strong> — é gratuita e voltada para engajamento e diversão durante a fase de grupos.</p>
        <p>6.2. A premiação é exclusiva da <strong className="text-white">Fase 2 (Mata-Mata)</strong>, calculada sobre o valor líquido arrecadado, descontada a taxa do organizador.</p>
        <p className="mt-2">6.3. <strong className="text-white">Fase 2:</strong> O 1º colocado recebe 100% do prêmio líquido.</p>
        <p>6.4. O pagamento do prêmio é feito via PIX, em até 7 dias após a apuração oficial.</p>
        <p>6.5. O administrador pode ajustar os percentuais, mantendo transparência total na plataforma.</p>
      </>
    ),
  },
  {
    title: '7. Cancelamento e Exclusão',
    content: (
      <>
        <p>7.1. Participantes que violarem o regulamento podem ser desclassificados pelo administrador.</p>
        <p>7.2. Em caso de cancelamento de jogo pela FIFA, o palpite daquele jogo não pontua.</p>
        <p>7.3. Não haverá devolução do valor pago em caso de desclassificação por infração ao regulamento.</p>
        <p>7.4. O organizador reserva o direito de cancelar o bolão antes do início, com devolução total dos valores pagos.</p>
      </>
    ),
  },
  {
    title: '8. Responsabilidades',
    content: (
      <>
        <p>8.1. O organizador é responsável pela apuração dos resultados e distribuição dos prêmios.</p>
        <p>8.2. Os resultados oficiais utilizados são os publicados pela FIFA ao final de cada partida.</p>
        <p>8.3. O organizador não se responsabiliza por falhas técnicas de conexão do participante que impeçam o registro de palpites.</p>
        <p>8.4. Toda operação relevante é registrada com data e hora no sistema para fins de auditoria.</p>
        <p>8.5. O participante é responsável por manter seus dados de acesso em sigilo.</p>
      </>
    ),
  },
]

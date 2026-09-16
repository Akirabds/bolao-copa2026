'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v === true, 'Você deve aceitar o regulamento'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { acceptTerms: false },
  })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, phone: data.phone || undefined, cpf: data.cpf || undefined }),
    })
    const result = await res.json()

    if (result.success) {
      toast.success('Conta criada com sucesso! Bem-vindo!')
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f1117]">
      <div className="w-full max-w-md py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-900/40">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-slate-400 text-sm mt-1">Participe do Bolão da Copa 2026</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="label">Nome completo *</label>
              <input type="text" placeholder="Seu nome" className={`input ${errors.name ? 'input-error' : ''}`} {...register('name')} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">E-mail *</label>
              <input type="email" placeholder="seu@email.com" className={`input ${errors.email ? 'input-error' : ''}`} {...register('email')} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Telefone + CPF */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Telefone / WhatsApp</label>
                <input type="tel" placeholder="(11) 99999-9999" className={`input ${errors.phone ? 'input-error' : ''}`} {...register('phone')} />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="label">CPF (opcional)</label>
                <input type="text" placeholder="000.000.000-00" className="input" {...register('cpf')} />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="label">Confirmar senha *</label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Repita a senha"
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Aceite */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-green-500 cursor-pointer"
                  {...register('acceptTerms')}
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  Li e aceito o{' '}
                  <Link href="/regulamento" target="_blank" className="text-brand-400 hover:underline">
                    Regulamento
                  </Link>{' '}
                  e a Política de Privacidade do Bolão da Copa 2026
                </span>
              </label>
              {errors.acceptTerms && <p className="text-red-400 text-xs mt-1">{errors.acceptTerms.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full btn-lg mt-2">
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" />Criando conta...</>
              ) : (
                <><CheckCircle size={18} />Criar conta gratuitamente</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Entrar</Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-slate-600 hover:text-slate-400">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard'
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()

    if (result.success) {
      toast.success(`Bem-vindo, ${result.data.name}!`)
      router.push(result.data.redirectTo || redirect)
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao fazer login')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">E-mail</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          className={`input ${errors.email ? 'input-error' : ''}`}
          {...register('email')}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Senha</label>
          <Link href="/recuperar-senha" className="text-xs text-brand-400 hover:text-brand-300">
            Esqueceu?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full btn-lg mt-2">
        {isSubmitting ? (
          <><Loader2 size={18} className="animate-spin" />Entrando...</>
        ) : 'Entrar'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f1117]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-900/40">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bolão da Copa 2026</h1>
          <p className="text-slate-400 text-sm mt-1">Entre na sua conta para continuar</p>
        </div>

        <div className="card p-6">
          <Suspense fallback={<div className="h-48 animate-pulse bg-surface-50 rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-medium">
            Cadastre-se gratuitamente
          </Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-slate-600 hover:text-slate-400">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  )
}

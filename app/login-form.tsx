'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

type FormMode = 'login' | 'recovery'

export default function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<FormMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  function changeMode(nextMode: FormMode) {
    setMode(nextMode)
    setPassword('')
    setErrorMessage('')
    setNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setNotice('')
    setLoading(true)

    try {
      const supabase = createClient()
      const normalizedEmail = email.trim()

      if (mode === 'recovery') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        if (!siteUrl) {
          setErrorMessage('A recuperação está indisponível no momento. Tente novamente mais tarde.')
          return
        }

        let redirectTo: string
        try {
          const site = new URL(siteUrl)
          const isLocal = site.hostname === 'localhost' || site.hostname === '127.0.0.1'
          if ((site.protocol !== 'https:' && !isLocal) || site.username || site.password) {
            setErrorMessage('A recuperação está indisponível no momento. Tente novamente mais tarde.')
            return
          }
          redirectTo = new URL(
            '/auth/callback?next=%2Fredefinir-senha',
            site.origin
          ).toString()
        } catch {
          setErrorMessage('A recuperação está indisponível no momento. Tente novamente mais tarde.')
          return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        })

        if (error) {
          setErrorMessage('Não foi possível solicitar a recuperação agora. Verifique sua conexão e tente novamente.')
          return
        }

        setNotice('Se houver uma conta associada a este e-mail, enviaremos instruções para redefinir a senha.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        console.error('Erro de autenticação:', error.code)
        setErrorMessage('Não foi possível entrar. Confira o e-mail e a senha e tente novamente.')
        return
      }

      router.replace('/painel')
      router.refresh()
    } catch {
      setErrorMessage('Não foi possível conectar ao sistema. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  const isRecovery = mode === 'recovery'
  const submitLabels = { login: loading ? 'Entrando...' : 'Entrar', recovery: loading ? 'Solicitando...' : 'Enviar link de recuperação' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />
      </div>

      {!isRecovery && (
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
        </div>
      )}

      {errorMessage && (
        <p role="alert" style={{ color: '#b42318', fontSize: 14, margin: 0 }}>
          {errorMessage}
        </p>
      )}
      {notice && (
        <p role="status" className="notice" style={{ fontSize: 14, margin: 0 }}>
          {notice}
        </p>
      )}

      <button
        className="button"
        type="submit"
        disabled={loading}
        style={{ width: '100%', marginTop: 4 }}
      >
        {submitLabels[mode]}
      </button>

      <button
        type="button"
        className="text-button"
        onClick={() => changeMode(isRecovery ? 'login' : 'recovery')}
        disabled={loading}
        style={{ color: 'var(--green)', background: 'none', border: 0, cursor: 'pointer' }}
      >
        {isRecovery ? 'Voltar para entrar' : 'Esqueci minha senha'}
      </button>
    </form>
  )
}
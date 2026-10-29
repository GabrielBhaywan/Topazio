'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error('Erro de autenticação:', error.message, error.code)
        setErrorMessage(
        'Não foi possível entrar. Consulte o terminal do navegador para identificar o erro.'
        )
        return
        }

      router.replace('/painel')
      router.refresh()
    } catch {
      setErrorMessage(
        'Não foi possível conectar ao sistema. Tente novamente em instantes.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
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

      {errorMessage && (
        <p role="alert" style={{ color: '#b42318', fontSize: 14, margin: 0 }}>
          {errorMessage}
        </p>
      )}

      <button
        className="button"
        type="submit"
        disabled={loading}
        style={{ width: '100%', marginTop: 4 }}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function TesteLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resultado, setResultado] = useState('')
  const [loading, setLoading] = useState(false)

  async function testarLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResultado('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error('Resultado do teste de autenticação:', {
          message: error.message,
          code: error.code,
          status: error.status,
        })

        setResultado(
          `Falha na autenticação. Código: ${error.code ?? 'não informado'}. Mensagem: ${error.message}`
        )
        return
      }

      setResultado(
        `Autenticação bem-sucedida! Usuário autenticado: ${data.user.email}`
      )

      await supabase.auth.signOut()
    } catch {
      setResultado('Não foi possível executar o teste. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ paddingBlock: 48 }}>
      <section className="card" style={{ maxWidth: 440, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Teste de autenticação</h1>

        <p className="muted">
          Página temporária para verificar o acesso ao Supabase.
        </p>

        <form onSubmit={testarLogin} style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label htmlFor="teste-email">E-mail</label>
            <input
              id="teste-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="teste-senha">Senha</label>
            <input
              id="teste-senha"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Testando...' : 'Testar autenticação'}
          </button>
        </form>

        {resultado && (
          <p role="status" style={{ marginTop: 20, overflowWrap: 'anywhere' }}>
            {resultado}
          </p>
        )}
      </section>
    </main>
  )
}
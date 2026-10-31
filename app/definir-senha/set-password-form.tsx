'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function SetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirmation) {
      setMessage('As senhas não coincidem.')
      return
    }

    setBusy(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()

      if (sessionError || !user) {
        setMessage('Sua sessão de convite não está ativa. Abra novamente o link recebido ou solicite ajuda à administração.')
        return
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage('Não foi possível definir a senha. Solicite um novo convite.')
        return
      }
      router.replace('/painel')
      router.refresh()
    } catch {
      setMessage('Não foi possível conectar ao sistema. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
      <div className="field">
        <label htmlFor="new-password">Nova senha</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={busy}
        />
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirme a senha</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          disabled={busy}
        />
      </div>
      {message && (
        <p role="alert" style={{ color: '#b42318', fontSize: 14, margin: 0 }}>
          {message}
        </p>
      )}
      <button className="button" type="submit" disabled={busy}>
        {busy ? 'Salvando...' : 'Definir senha'}
      </button>
    </form>
  )
}

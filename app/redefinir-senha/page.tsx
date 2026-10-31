import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import SetPasswordForm from '../definir-senha/set-password-form'

export const metadata = { title: 'Redefinir senha | Topázio' }

export default async function ResetPasswordPage() {
  let hasSession = false
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    hasSession = Boolean(user) && !error
  } catch {
    redirect('/?auth=indisponivel')
  }

  if (!hasSession) redirect('/?auth=sessao-ausente')

  return (
    <main
      className="container"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', paddingBlock: 32 }}
    >
      <section className="card" style={{ width: 'min(100%, 440px)', padding: 32 }}>
        <p className="brand">Topázio<span>.</span></p>
        <p className="eyebrow" style={{ marginTop: 32 }}>Recuperação de acesso</p>
        <h1 style={{ fontSize: 28, letterSpacing: '-.04em', margin: '8px 0' }}>
          Crie uma nova senha
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Escolha uma nova senha para sua conta.
        </p>
        <SetPasswordForm />
      </section>
    </main>
  )
}
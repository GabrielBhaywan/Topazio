import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import SetPasswordForm from './set-password-form'

export const metadata = { title: 'Definir senha | Topázio' }

export default async function SetPasswordPage() {
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
        <Link className="brand" href="/">
          Topázio<span>.</span>
        </Link>
        <p className="eyebrow" style={{ marginTop: 32 }}>Acesso seguro</p>
        <h1 style={{ fontSize: 28, letterSpacing: '-.04em', margin: '8px 0' }}>
          Defina sua senha
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Escolha uma senha para concluir o acesso à sua conta.
        </p>
        <SetPasswordForm />
      </section>
    </main>
  )
}
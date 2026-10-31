import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import SetPasswordForm from './set-password-form'

export const metadata = { title: 'Definir senha | Topázio' }

export default async function SetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?convite=erro')

  return (
    <main
      className="container"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', paddingBlock: 32 }}
    >
      <section className="card" style={{ width: 'min(100%, 440px)', padding: 32 }}>
        <Link className="brand" href="/">
          Topázio<span>.</span>
        </Link>
        <p className="eyebrow" style={{ marginTop: 32 }}>Convite recebido</p>
        <h1 style={{ fontSize: 28, letterSpacing: '-.04em', margin: '8px 0' }}>
          Defina sua senha
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          Crie uma senha para concluir a configuração do seu acesso.
        </p>
        <SetPasswordForm />
      </section>
    </main>
  )
}

import Link from 'next/link'
import LoginForm from './login-form'

type HomePageProps = {
  searchParams?: Promise<{ convite?: string; auth?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined
  const authMessages: Record<string, string> = {
    'link-invalido': 'Este link expirou ou não pôde ser validado. Solicite uma nova redefinição de senha ou peça outro convite à administração.',
    'sessao-ausente': 'Sua sessão não está ativa. Abra novamente o link recebido por e-mail.',
    indisponivel: 'Não foi possível validar sua sessão agora. Tente novamente em instantes.',
  }
  const authMessage = params?.auth ? authMessages[params.auth] : undefined
  return (
    <main
      className="container"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        paddingBlock: 40,
      }}
    >
      <section
        className="card"
        style={{ width: 'min(100%, 440px)', padding: 32 }}
      >
        <div className="brand" style={{ marginBottom: 32 }}>
          Topázio<span>.</span>
        </div>

        <p className="eyebrow">Acesso ao sistema</p>

        <h1 style={{ fontSize: 28, letterSpacing: '-.04em', margin: '8px 0' }}>
          Entre na sua conta
        </h1>

        <p className="muted" style={{ lineHeight: 1.6, margin: '0 0 24px' }}>
          Acesse o ambiente de gestão da sua empresa.
        </p>

        {params?.convite === 'erro' && (
          <div className="notice" role="alert" style={{ marginBottom: 20 }}>
            O convite expirou ou não pôde ser validado. Solicite um novo convite
            à administração.
          </div>
        )}
        {authMessage && (
          <div className="notice" role="alert" style={{ marginBottom: 20 }}>
            {authMessage}
          </div>
        )}

        <LoginForm />

        <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13 }}>
          <Link href="/sem-permissao" style={{ color: 'var(--green)' }}>
            Sobre o acesso ao sistema
          </Link>
        </div>
      </section>
    </main>
  )
}
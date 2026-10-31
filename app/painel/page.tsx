import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

const modules = [
  'Produtos e serviços',
  'Pedidos',
  'Financeiro',
  'Relatórios',
  'Atividades',
]

export default async function PanelPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/sem-permissao')
  }

  let companyName = 'Administração RumoFalcão'

  if (profile.role === 'company_user') {
    if (!profile.company_id) {
      redirect('/sem-permissao')
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, status')
      .eq('id', profile.company_id)
      .maybeSingle()

    if (
      companyError ||
      !company ||
      company.status !== 'active'
    ) {
      redirect('/sem-permissao')
    }

    companyName = company.name
  } else if (
    profile.role !== 'rumofalcao_admin' ||
    profile.company_id !== null
  ) {
    redirect('/sem-permissao')
  }

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" href="/">
            Topázio<span>.</span>
          </Link>

          <span className="muted" style={{ fontSize: 14 }}>
            {profile.full_name}
          </span>
        </div>
      </header>

      <main className="container" style={{ paddingBlock: 48 }}>
        <p className="eyebrow">Visão geral</p>

        <h1
          style={{
            fontSize: 32,
            letterSpacing: '-.04em',
            margin: '8px 0',
          }}
        >
          Bem-vindo ao Topázio
        </h1>

        <p className="muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Acesse o ambiente de gestão da sua empresa.
        </p>

        <section
          className="card"
          style={{ padding: 24, marginBlock: 24 }}
        >
          <p className="eyebrow" style={{ marginTop: 0 }}>
            {profile.role === 'rumofalcao_admin'
              ? 'Administração'
              : 'Sua empresa'}
          </p>

          <h2 style={{ marginBottom: 8 }}>{companyName}</h2>

          <p className="muted" style={{ marginBottom: 0 }}>
            {profile.role === 'rumofalcao_admin'
              ? 'Área administrativa da RumoFalcão.'
              : 'Área de gestão da empresa conectada à sua conta.'}
          </p>
          {profile.role === 'rumofalcao_admin' && (
            <p style={{ marginBottom: 0, marginTop: 20 }}>
              <Link className="button" href="/painel/empresas">
                Administrar empresas
              </Link>
            </p>
          )}
        </section>

        <h2 style={{ fontSize: 18, marginBlock: '28px 14px' }}>
          Módulos planejados
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {modules.map((name) => (
            <div
              className="card"
              key={name}
              style={{ padding: 18, color: 'var(--muted)' }}
            >
              {name}

              <div style={{ fontSize: 12, marginTop: 10 }}>
                Disponível em etapa futura
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

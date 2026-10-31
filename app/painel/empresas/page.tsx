import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminAuthorization } from '@/lib/admin-auth'
import CompaniesManager, { type Company } from './companies-manager'

export const metadata = { title: 'Empresas | Topázio' }

export default async function CompaniesPage() {
  const authorization = await getAdminAuthorization()
  if (!authorization.authorized) {
    redirect(authorization.status === 401 ? '/' : '/sem-permissao')
  }

  const { data, error } = await authorization.supabase
    .from('companies')
    .select('id, name, status, created_at, updated_at')
    .order('name', { ascending: true })

  const companies = (error ? [] : data ?? []) as Company[]

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" href="/painel">
            Topázio<span>.</span>
          </Link>
          <Link className="button-secondary" href="/painel">
            Voltar ao painel
          </Link>
        </div>
      </header>
      <main className="container" style={{ paddingBlock: 40 }}>
        <p className="eyebrow">Administração</p>
        <h1 style={{ fontSize: 32, letterSpacing: '-.04em', margin: '8px 0' }}>
          Empresas
        </h1>
        <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
          Cadastre empresas, convide seus responsáveis e controle o acesso.
        </p>
        {error && (
          <div className="notice" role="alert" style={{ marginBlock: 20 }}>
            Não foi possível carregar a lista. Atualize a página ou verifique o
            acesso ao banco de dados.
          </div>
        )}
        <CompaniesManager initialCompanies={companies} />
      </main>
    </>
  )
}

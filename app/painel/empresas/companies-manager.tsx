'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export type Company = {
  id: string
  name: string
  status: 'active' | 'blocked'
  created_at: string
  updated_at: string
}

type Props = { initialCompanies: Company[] }

export default function CompaniesManager({ initialCompanies }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return initialCompanies.filter((company) =>
      company.name.toLocaleLowerCase('pt-BR').includes(query)
    )
  }, [initialCompanies, search])

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setBusy(true)

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, fullName, email }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(result.error ?? 'Não foi possível cadastrar a empresa.')
        return
      }

      setMessage(result.message ?? 'Empresa cadastrada e convite enviado.')
      setCompanyName('')
      setFullName('')
      setEmail('')
      router.refresh()
    } catch {
      setErrorMessage('Não foi possível conectar ao sistema. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(company: Company) {
    const nextStatus = company.status === 'active' ? 'blocked' : 'active'
    const action = nextStatus === 'blocked' ? 'bloquear' : 'reativar'
    if (!window.confirm('Deseja ' + action + ' “' + company.name + '”?')) return

    setMessage('')
    setErrorMessage('')
    setUpdatingId(company.id)

    try {
      const response = await fetch('/api/admin/companies/' + company.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(result.error ?? 'Não foi possível atualizar a empresa.')
        return
      }

      setMessage(
        nextStatus === 'blocked'
          ? 'Empresa bloqueada. O acesso foi suspenso.'
          : 'Empresa reativada. O acesso foi restaurado.'
      )
      router.refresh()
    } catch {
      setErrorMessage('Não foi possível conectar ao sistema. Tente novamente.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Cadastrar empresa</h2>
        <p className="muted" style={{ lineHeight: 1.55 }}>
          O responsável receberá um convite por e-mail para definir a própria
          senha. O cadastro criará uma conta comum vinculada a esta empresa.
        </p>
        <form onSubmit={createCompany} style={{ display: 'grid', gap: 16 }}>
          <div className="field">
            <label htmlFor="company-name">Nome da empresa</label>
            <input
              id="company-name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              minLength={2}
              maxLength={120}
              autoComplete="organization"
              required
              disabled={busy}
            />
          </div>
          <div className="field">
            <label htmlFor="responsible-name">Nome completo do responsável</label>
            <input
              id="responsible-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={120}
              autoComplete="name"
              required
              disabled={busy}
            />
          </div>
          <div className="field">
            <label htmlFor="responsible-email">E-mail de acesso</label>
            <input
              id="responsible-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              required
              disabled={busy}
            />
          </div>
          {message && <p role="status" className="notice">{message}</p>}
          {errorMessage && (
            <p
              role="alert"
              style={{ color: '#b42318', fontSize: 14, margin: 0 }}
            >
              {errorMessage}
            </p>
          )}
          <div>
            <button className="button" type="submit" disabled={busy}>
              {busy ? 'Enviando convite...' : 'Cadastrar e enviar convite'}
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Empresas cadastradas</h2>
          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="company-search">Pesquisar por nome</label>
            <input
              id="company-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <p className="muted">
            {search ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa cadastrada.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '12px 8px' }}>Empresa</th>
                  <th style={{ padding: '12px 8px' }}>Cadastro</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                      {company.name}
                    </td>
                    <td style={{ padding: '14px 8px', color: 'var(--muted)' }}>
                      {new Intl.DateTimeFormat('pt-BR').format(
                        new Date(company.created_at)
                      )}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          borderRadius: 999,
                          padding: '5px 10px',
                          background: company.status === 'active' ? '#e8f4ed' : '#fbeaea',
                          color: company.status === 'active' ? '#176b50' : '#a32c2c',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {company.status === 'active' ? 'Ativa' : 'Bloqueada'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <button
                        className="button-secondary"
                        type="button"
                        disabled={updatingId !== null}
                        onClick={() => changeStatus(company)}
                      >
                        {updatingId === company.id
                          ? 'Salvando...'
                          : company.status === 'active'
                            ? 'Bloquear'
                            : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

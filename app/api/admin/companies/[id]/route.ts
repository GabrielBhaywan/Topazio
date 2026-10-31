import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAdminAuthorization, hasTrustedOrigin } from '@/lib/admin-auth'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await getAdminAuthorization()
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        error:
          authorization.status === 401
            ? 'Autenticação necessária.'
            : 'Acesso negado.',
      },
      { status: authorization.status }
    )
  }

  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { error: 'Origem da solicitação não autorizada.' },
      { status: 403 }
    )
  }

  const { id } = await context.params
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Formato de solicitação inválido.' },
      { status: 400 }
    )
  }

  const status =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>).status
      : undefined

  if (status !== 'active' && status !== 'blocked') {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  // A chave administrativa só é usada depois da autorização no servidor.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('companies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, status, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível atualizar o status da empresa.' },
      { status: 500 }
    )
  }
  if (!data) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ company: data })
}

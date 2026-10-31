import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAdminAuthorization, hasTrustedOrigin } from '@/lib/admin-auth'

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  const authorization = await getAdminAuthorization()
  if (!authorization.authorized) {
    return errorResponse(
      authorization.status === 401 ? 'Autenticação necessária.' : 'Acesso negado.',
      authorization.status
    )
  }

  const { data, error } = await authorization.supabase
    .from('companies')
    .select('id, name, status, created_at, updated_at')
    .order('name', { ascending: true })

  if (error) {
    return errorResponse('Não foi possível carregar as empresas.', 500)
  }

  return NextResponse.json({ companies: data ?? [] })
}

export async function POST(request: NextRequest) {
  const authorization = await getAdminAuthorization()
  if (!authorization.authorized) {
    return errorResponse(
      authorization.status === 401 ? 'Autenticação necessária.' : 'Acesso negado.',
      authorization.status
    )
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse('Origem da solicitação não autorizada.', 403)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > 16_384) {
    return errorResponse('Solicitação muito grande.', 413)
  }

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return errorResponse('Formato de solicitação inválido.', 400)
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return errorResponse('Dados do cadastro inválidos.', 400)
  }

  const fields = input as Record<string, unknown>
  const companyName =
    typeof fields.companyName === 'string' ? fields.companyName.trim() : ''
  const fullName =
    typeof fields.fullName === 'string' ? fields.fullName.trim() : ''
  const email =
    typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''

  if (companyName.length < 2 || companyName.length > 120) {
    return errorResponse('Informe um nome de empresa entre 2 e 120 caracteres.', 400)
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return errorResponse('Informe um nome entre 2 e 120 caracteres.', 400)
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return errorResponse('Informe um e-mail válido.', 400)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return errorResponse('A URL pública do sistema não está configurada.', 503)
  }

  let redirectTo: string
  try {
    const site = new URL(siteUrl)
    if (
      site.protocol !== 'https:' &&
      site.hostname !== 'localhost' &&
      site.hostname !== '127.0.0.1'
    ) {
      return errorResponse('A URL pública do sistema não é válida.', 503)
    }
    redirectTo = new URL(
      '/auth/callback?next=%2Fdefinir-senha',
      site
    ).toString()
  } catch {
    return errorResponse('A URL pública do sistema não é válida.', 503)
  }

  // A chave secreta só é carregada depois de validar sessão e perfil no servidor.
  const admin = createAdminClient()
  const { data: invitation, error: invitationError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    })

  if (invitationError || !invitation.user) {
    return errorResponse(
      'Não foi possível enviar o convite. Verifique se o e-mail já possui uma conta.',
      409
    )
  }

  const invitedUserId = invitation.user.id
  const { data: companyId, error: createError } = await admin.rpc(
    'admin_create_company_for_user',
    {
      p_name: companyName,
      p_full_name: fullName,
      p_user_id: invitedUserId,
    }
  )

  if (!createError && companyId) {
    return NextResponse.json(
      { companyId, message: 'Empresa cadastrada e convite enviado.' },
      { status: 201 }
    )
  }

  // A resposta do RPC pode se perder após o commit; confirme antes de compensar.
  const { data: createdProfile, error: profileCheckError } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', invitedUserId)
    .maybeSingle()

  if (profileCheckError) {
    return errorResponse(
      'O convite foi enviado, mas não foi possível confirmar o cadastro. Solicite suporte antes de reenviar.',
      500
    )
  }

  if (createdProfile) {
    if (
      createdProfile.role === 'company_user' &&
      createdProfile.company_id
    ) {
      const { data: createdCompany, error: companyCheckError } = await admin
        .from('companies')
        .select('id')
        .eq('id', createdProfile.company_id)
        .maybeSingle()

      if (!companyCheckError && createdCompany) {
        return NextResponse.json(
          {
            companyId: createdCompany.id,
            message: 'Empresa cadastrada e convite enviado.',
          },
          { status: 201 }
        )
      }
    }

    return errorResponse(
      'O convite foi enviado, mas o cadastro precisa de verificação administrativa.',
      500
    )
  }

  const { error: cleanupError } = await admin.auth.admin.deleteUser(invitedUserId)
  if (cleanupError) {
    return errorResponse(
      'O cadastro não foi concluído e o convite não pôde ser cancelado. Solicite suporte antes de reenviar.',
      500
    )
  }

  return errorResponse(
    'O cadastro não foi concluído. O convite foi cancelado; confira a migração do banco e tente novamente.',
    500
  )
}

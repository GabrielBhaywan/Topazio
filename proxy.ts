import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Keep diagnostic pages available locally, but do not expose them in production.
  if (
    process.env.NODE_ENV === 'production' &&
    (pathname === '/teste-login' || pathname === '/teste-conexao')
  ) {
    return new NextResponse(null, { status: 404 })
  }

  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('As variáveis de ambiente do Supabase não foram configuradas.')
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: verifiedToken } = await supabase.auth.getClaims()
  const claims = verifiedToken?.claims

  const isProtectedPath = pathname === '/painel' || pathname.startsWith('/painel/')
  if (!isProtectedPath) return response

  function redirectWithCookies(path: string) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  if (!claims?.sub) {
    return redirectWithCookies('/')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', claims.sub)
    .maybeSingle()

  if (profileError || !profile) {
    return redirectWithCookies('/sem-permissao')
  }

  if (profile.role === 'company_user' && profile.company_id) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('status')
      .eq('id', profile.company_id)
      .maybeSingle()

    if (companyError || !company || company.status !== 'active') {
      return redirectWithCookies('/sem-permissao')
    }
  } else if (
    profile.role !== 'rumofalcao_admin' ||
    profile.company_id !== null
  ) {
    return redirectWithCookies('/sem-permissao')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

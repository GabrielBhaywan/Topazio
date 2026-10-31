import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/definir-senha'
  }
  return value
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }

    console.error('[auth callback] PKCE code exchange failed', {
      code: error.code ?? 'unknown',
      status: error.status ?? 'unknown',
    })
  } else if (tokenHash && type === 'invite') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'invite',
    })
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }

    console.error('[auth callback] invite token verification failed', {
      code: error.code ?? 'unknown',
      status: error.status ?? 'unknown',
    })
  } else {
    console.error('[auth callback] authorization data missing or unsupported', {
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      hasType: Boolean(type),
      hasAuthError: request.nextUrl.searchParams.has('error'),
    })
  }

  return NextResponse.redirect(new URL('/?convite=erro', request.url))
}

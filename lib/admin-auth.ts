import 'server-only'

import { createClient } from '@/lib/supabase-server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export type AdminAuthorization =
  | { authorized: true; userId: string; supabase: ServerSupabase }
  | { authorized: false; status: 401 | 403 }

export async function getAdminAuthorization(): Promise<AdminAuthorization> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (
    profileError ||
    !profile ||
    profile.role !== 'rumofalcao_admin' ||
    profile.company_id !== null
  ) {
    return { authorized: false, status: 403 }
  }

  return { authorized: true, userId: user.id, supabase }
}

export function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  try {
    const expectedOrigin = configuredSiteUrl
      ? new URL(configuredSiteUrl).origin
      : new URL(request.url).origin
    return origin === expectedOrigin
  } catch {
    return false
  }
}

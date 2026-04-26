import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  
  // Need to use URL object to handle relative redirect in Route Handlers
  const url = new URL('/login', request.url)
  return Response.redirect(url)
}

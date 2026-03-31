import { createClient } from '@/lib/supabase-server'

export async function POST(request) {
  const { email } = await request.json()

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(String(email))) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('waitlist')
    .insert([{ email: String(email).toLowerCase().trim() }])

  if (error) {
    // Duplicate email — treat as success so we don't leak whether an email is on the list
    if (error.code === '23505') return Response.json({ success: true })
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return Response.json({ success: true })
}
import { createClient } from '@/lib/supabase-server'
import { summarizeForUser } from '@/lib/summarize'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const focus: string | undefined = typeof body.focus === 'string' ? body.focus.slice(0, 200) : undefined

  let digest: string | null
  try {
    digest = await summarizeForUser(supabase, user.id, focus)
  } catch (err) {
    console.error('Summarization failed:', err)
    return NextResponse.json({ error: 'Failed to generate digest. Please try again.' }, { status: 500 })
  }

  if (!digest) {
    return NextResponse.json(
      { error: 'No content to summarize. Try fetching your sources first.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ digest })
}

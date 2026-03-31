import { createClient } from '@/lib/supabase-server'
import { ingestForUser } from '@/lib/ingest'
import { NextResponse } from 'next/server'

export async function POST(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inserted = await ingestForUser(supabase, user.id)
  return NextResponse.json({ message: 'Done', inserted })
}

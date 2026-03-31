import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

function digestToHtml(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#999;">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

function buildEmailHtml(digest: string, appUrl: string): string {
  return `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#ffffff;color:#1a1a1a;">
      <p style="font-size:13px;color:#999;margin:0 0 32px;letter-spacing:0.04em;text-transform:uppercase;">Morning Cup</p>
      <div style="font-size:16px;line-height:1.8;color:#1a1a1a;">
        ${digestToHtml(digest)}
      </div>
      <hr style="margin:40px 0;border:none;border-top:1px solid #e5e5e5;">
      <p style="font-size:12px;color:#999;">
        You're receiving this because you signed up for Morning Cup.<br>
        <a href="${appUrl}/dashboard" style="color:#999;">Manage your sources</a>
      </p>
    </div>
  `
}

async function getLatestDigest(supabase: any, userId: string) {
  const { data } = await supabase
    .from('digests')
    .select('content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data?.content ?? null
}

// GET — renders the email HTML directly in the browser
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const digest = await getLatestDigest(supabase, user.id)

  if (!digest) {
    return new Response('<p style="font-family:sans-serif;padding:2rem;">No digest found. Generate one from the dashboard first.</p>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const html = buildEmailHtml(digest, process.env.NEXT_PUBLIC_APP_URL ?? '')

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}

// POST — sends a test copy to the logged-in user's own email
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const digest = await getLatestDigest(supabase, user.id)

  if (!digest) {
    return NextResponse.json({ error: 'No digest found. Generate one from the dashboard first.' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `[TEST] Morning Cup — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
  const html = buildEmailHtml(digest, process.env.NEXT_PUBLIC_APP_URL ?? '')

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    to: user.email,
    subject,
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sent: true, to: user.email })
}

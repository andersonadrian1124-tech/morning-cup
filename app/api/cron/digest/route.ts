import { createAdminClient } from '@/lib/supabase-admin'
import { ingestForUser } from '@/lib/ingest'
import { summarizeForUser } from '@/lib/summarize'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export const maxDuration = 300

function digestToHtml(markdown: string): string {
  return markdown
    // markdown links → html links (block javascript: URLs)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safe = url.trim().toLowerCase().startsWith('javascript:') ? '#' : url
      return `<a href="${safe}" style="color:#92400e;">${text}</a>`
    })
    // bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // newlines → <br>
    .replace(/\n/g, '<br>')
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  return !!secret && auth === `Bearer ${secret}`
}

async function runDigest() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const results: Array<{ userId: string; status: string; reason?: string }> = []

  // Paginate through all users (listUsers returns max 1000 per page)
  let page = 1
  const perPage = 100

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      console.error('Failed to list users:', error)
      break
    }

    if (!users?.length) break

    for (const user of users) {
      if (!user.email) continue

      try {
        // Skip if a digest was already generated and sent today
        const { data: existing } = await supabase
          .from('digests')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .maybeSingle()

        if (existing) {
          results.push({ userId: user.id, status: 'skipped', reason: 'already sent today' })
          continue
        }

        await ingestForUser(supabase, user.id)
        const digest = await summarizeForUser(supabase, user.id)

        if (!digest) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no content' })
          continue
        }

        const { error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
          to: user.email,
          subject: `Morning Cup — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#ffffff;color:#1a1a1a;">
              <p style="font-size:13px;color:#999;margin:0 0 32px;letter-spacing:0.04em;text-transform:uppercase;">Morning Cup</p>
              <div style="font-size:16px;line-height:1.8;color:#1a1a1a;">
                ${digestToHtml(digest)}
              </div>
              <hr style="margin:40px 0;border:none;border-top:1px solid #e5e5e5;">
              <p style="font-size:12px;color:#999;">
                You're receiving this because you signed up for Morning Cup.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#999;">Manage your sources</a>
              </p>
            </div>
          `,
        })

        if (emailError) {
          results.push({ userId: user.id, status: 'error', reason: emailError.message })
        } else {
          results.push({ userId: user.id, status: 'sent' })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Failed for user ${user.id}:`, err)
        results.push({ userId: user.id, status: 'error', reason: message })
      }
    }

    if (users.length < perPage) break
    page++
  }

  return results
}

// Vercel Cron Jobs call GET — CRON_SECRET is sent automatically as Bearer token
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await runDigest()
  return NextResponse.json({ results })
}

// Keep POST for manual testing via curl
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await runDigest()
  return NextResponse.json({ results })
}

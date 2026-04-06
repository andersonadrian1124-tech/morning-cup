import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { deleteSource } from '@/app/actions'
import SourceForm from './SourceForm'
import FetchButton from './FetchButton'
import DigestView from './DigestView'
import EmailTestButton from './EmailTestButton'

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

const TYPE_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  rss: 'RSS',
  podcast: 'Podcast',
  newsletter: 'Newsletter',
}

const css = `
  *, *::before, *::after { box-sizing: border-box; }

  .mc-signout {
    background: none;
    border: none;
    color: #888896;
    font-family: var(--font-geist-sans);
    font-size: 0.825rem;
    cursor: pointer;
    padding: 0;
    transition: color 160ms ease-out;
  }
  .mc-signout:hover { color: #f0f0f2; }

  .mc-source-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .mc-source-row:last-child { border-bottom: none; }

  .mc-type-pill {
    flex-shrink: 0;
    font-family: var(--font-geist-mono);
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: #4353FF;
    background: rgba(67,83,255,0.12);
    border: 1px solid rgba(67,83,255,0.2);
    border-radius: 4px;
    padding: 0.2rem 0.55rem;
    text-transform: uppercase;
  }

  .mc-remove {
    flex-shrink: 0;
    margin-left: auto;
    background: none;
    border: none;
    color: #555560;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    transition: color 160ms ease-out, background 160ms ease-out;
  }
  .mc-remove:hover { color: #f0f0f2; background: rgba(255,255,255,0.06); }
`

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })

  const sourceList = sources ?? []

  return (
    <>
      <style>{css}</style>
      <div style={{ background: '#0a0a0a', color: '#f0f0f2', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>

        {/* Nav */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
                Morning Cup
              </span>
            </a>
            <form action="/auth/signout" method="post">
              <button type="submit" className="mc-signout">Sign out</button>
            </form>
          </div>
        </nav>

        {/* Background glow */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
            width: '800px', height: '600px',
            background: 'radial-gradient(ellipse at center, rgba(67,83,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem 7rem', position: 'relative' }}>

            {/* Greeting */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(67,83,255,0.1)', border: '1px solid rgba(67,83,255,0.2)',
                borderRadius: '100px', padding: '0.3rem 0.85rem', marginBottom: '1.25rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4353FF', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: '#4353FF' }}>
                  GOOD MORNING
                </span>
              </div>
              <p style={{ color: '#888896', fontSize: '0.875rem', margin: 0 }}>{user.email}</p>
            </div>

            {/* Sources card */}
            <div style={{
              background: '#111112', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '2rem', marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', color: '#aaaab8', textTransform: 'uppercase', fontWeight: 500 }}>
                  Your Sources
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', color: '#777780' }}>
                    {sourceList.length} {sourceList.length === 1 ? 'source' : 'sources'}
                  </span>
                  {sourceList.length > 0 && <FetchButton />}
                </div>
              </div>

              {sourceList.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem' }}>
                  {sourceList.map((source) => (
                    <li key={source.id} className="mc-source-row">
                      <span className="mc-type-pill">{TYPE_LABEL[source.type] ?? source.type}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {source.name && source.name !== source.url ? source.name : getDomain(source.url)}
                        </p>
                        <p style={{ margin: 0, fontFamily: 'var(--font-geist-mono)', fontSize: '0.68rem', color: '#777780', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                          {getDomain(source.url)}
                        </p>
                      </div>
                      <form action={deleteSource}>
                        <input type="hidden" name="id" value={source.id} />
                        <button type="submit" className="mc-remove">×</button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#777780', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  No sources yet. Add a newsletter, YouTube channel, podcast, or blog to get started.
                </p>
              )}

              <SourceForm />
            </div>

            {/* Digest card */}
            <div style={{
              background: '#111112', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '2rem', marginBottom: '1.25rem',
              boxShadow: '0 0 0 1px rgba(67,83,255,0.08), 0 24px 48px rgba(0,0,0,0.4)',
            }}>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', color: '#aaaab8', textTransform: 'uppercase', fontWeight: 500, display: 'block', marginBottom: '1.25rem' }}>
                Generate digest
              </span>
              <DigestView />
            </div>

            {/* Email testing — subtle */}
            <div style={{
              background: '#111112', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '1.5rem 2rem',
            }}>
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', color: '#444450', textTransform: 'uppercase', fontWeight: 500, display: 'block', marginBottom: '1rem' }}>
                Email testing
              </span>
              <EmailTestButton />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

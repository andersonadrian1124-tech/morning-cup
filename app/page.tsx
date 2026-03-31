import { createClient } from '@/lib/supabase-server'
import { deleteSource } from '@/app/actions'
import SourceForm from './dashboard/SourceForm'
import DigestAction from './dashboard/DigestAction'

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

  .mc-nav-cta {
    display: inline-flex;
    align-items: center;
    background: #4353FF;
    color: #fff;
    font-family: var(--font-geist-sans);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    padding: 0.55rem 1.2rem;
    border-radius: 6px;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background 160ms ease-out, transform 160ms ease-out, box-shadow 160ms ease-out;
  }
  .mc-nav-cta:hover {
    background: #5563FF;
    box-shadow: 0 4px 20px rgba(67,83,255,0.35);
    transform: translateY(-1px);
  }
  .mc-nav-cta:active { transform: translateY(0); }
  .mc-nav-cta:focus-visible { outline: 2px solid #4353FF; outline-offset: 3px; }

  .mc-hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #4353FF;
    color: #fff;
    font-family: var(--font-geist-sans);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.8rem 1.75rem;
    border-radius: 6px;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background 160ms ease-out, transform 160ms ease-out, box-shadow 160ms ease-out;
  }
  .mc-hero-cta:hover {
    background: #5563FF;
    box-shadow: 0 8px 32px rgba(67,83,255,0.4);
    transform: translateY(-2px);
  }
  .mc-hero-cta:active { transform: translateY(0); }

  .mc-hero-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    color: #888896;
    font-family: var(--font-geist-sans);
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.8rem 1.75rem;
    border-radius: 6px;
    text-decoration: none;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: border-color 160ms ease-out, color 160ms ease-out;
  }
  .mc-hero-ghost:hover {
    border-color: rgba(255,255,255,0.25);
    color: #f0f0f2;
  }

  .mc-feature-card {
    background: #111112;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 2rem;
    transition: border-color 200ms ease-out, transform 200ms ease-out;
  }
  .mc-feature-card:hover {
    border-color: rgba(67,83,255,0.3);
    transform: translateY(-2px);
  }

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

  .mc-input-waitlist {
    background: #111112;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #f0f0f2;
    padding: 0.85rem 1.25rem;
    font-size: 0.9rem;
    font-family: var(--font-geist-sans);
    width: 100%;
    transition: border-color 160ms ease-out, box-shadow 160ms ease-out;
  }
  .mc-input-waitlist::placeholder { color: #555560; }
  .mc-digest-textarea::placeholder { color: #555560; }
  .mc-input-waitlist:focus {
    outline: none;
    border-color: #4353FF;
    box-shadow: 0 0 0 3px rgba(67,83,255,0.15);
  }
`

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let sources: any[] = []
  if (user) {
    const { data } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })
    sources = data ?? []
  }

  return (
    <>
      <style>{css}</style>

      <div style={{ background: '#0a0a0a', color: '#f0f0f2', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>

        {/* ── Nav ── */}
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
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
                Morning Cup
              </span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {user ? (
                <form action="/auth/signout" method="post">
                  <button type="submit" className="mc-signout">Sign out</button>
                </form>
              ) : (
                <>
                  <a href="/login" style={{ color: '#888896', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 160ms ease-out' }}
                    onMouseEnter={undefined}>
                    Sign in
                  </a>
                  <a href="#signup" className="mc-nav-cta">Get started</a>
                </>
              )}
            </div>
          </div>
        </nav>

        {user ? (
          /* ── LOGGED-IN DASHBOARD ── */
          <div style={{ position: 'relative', overflow: 'hidden' }}>

            {/* Background glow */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
              width: '800px', height: '600px',
              background: 'radial-gradient(ellipse at center, rgba(67,83,255,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '5rem 2rem 7rem', position: 'relative' }}>

              {/* Hero greeting */}
              <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(67,83,255,0.1)', border: '1px solid rgba(67,83,255,0.2)',
                  borderRadius: '100px', padding: '0.3rem 0.85rem', marginBottom: '1.75rem',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4353FF', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: '#4353FF' }}>
                    GOOD MORNING
                  </span>
                </div>
                <h1 style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 700,
                  letterSpacing: '-0.04em', lineHeight: 1.08, color: '#f0f0f2', margin: '0 0 1rem',
                }}>
                  Your daily briefing,<br />
                  <span style={{ color: '#4353FF' }}>built around you.</span>
                </h1>
                <p style={{ color: '#888896', fontSize: '0.95rem', lineHeight: 1.75, margin: 0 }}>
                  Everything you follow, summarized before your coffee gets cold.<br />
                  <br />
                  You follow 30 sources. You read 3 of them.<br />
                  Morning Cup reads everything for you — newsletters, YouTube, podcasts and blogs.<br />
                  One email. Every morning. 5 minute read.
                </p>
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
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', color: '#777780' }}>
                    {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                  </span>
                </div>

                {sources.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem' }}>
                    {sources.map((source) => (
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
                borderRadius: '12px', padding: '2rem',
                boxShadow: '0 0 0 1px rgba(67,83,255,0.08), 0 24px 48px rgba(0,0,0,0.4)',
              }}>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', color: '#aaaab8', textTransform: 'uppercase', fontWeight: 500, display: 'block', marginBottom: '0.75rem' }}>
                  What do you want covered?
                </span>
                <p style={{ color: '#b0b0b8', fontSize: '0.925rem', margin: '0 0 1.75rem', lineHeight: 1.65 }}>
                  Tell us what matters. We&apos;ll read every source, write your digest, and send it to your inbox.
                </p>
                <DigestAction />
              </div>

            </div>
          </div>

        ) : (
          /* ── LOGGED-OUT LANDING PAGE ── */
          <>

            {/* Hero */}
            <section style={{ padding: 'clamp(5rem, 10vw, 8rem) 2rem clamp(4rem, 8vw, 6rem)', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(67,83,255,0.1)',
                border: '1px solid rgba(67,83,255,0.25)',
                borderRadius: '100px',
                padding: '0.35rem 0.9rem',
                marginBottom: '2rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4353FF', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: '#4353FF' }}>
                  FREE TO USE
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: 'clamp(2.75rem, 7vw, 5rem)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                color: '#f0f0f2',
                margin: '0 0 1rem',
              }}>
                Morning Cup ☕
              </h1>

              <p style={{
                fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                lineHeight: 1.5,
                color: '#b0b0b8',
                margin: '0 auto 1.25rem',
                maxWidth: '560px',
              }}>
                Everything you follow, summarized before your coffee gets cold.
              </p>

              <p style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
                lineHeight: 1.8,
                color: '#888896',
                margin: '0 auto 2.5rem',
                maxWidth: '520px',
              }}>
                You follow 30 sources. You read 3 of them.<br />
                Morning Cup reads everything for you — newsletters, YouTube, podcasts and blogs.<br />
                One email. Every morning. 5 minute read.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/signup" className="mc-hero-cta">Create free account →</a>
                <a href="#how" className="mc-hero-ghost">See how it works</a>
              </div>
            </section>

            {/* Divider */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>

            {/* How it works */}
            <section id="how" style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 6rem) 2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', color: '#444450', margin: '0 0 1rem', textTransform: 'uppercase' }}>
                  How it works
                </p>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0f0f2', margin: '0 0 1rem' }}>
                  Your inbox, curated in three steps
                </h2>
                <p style={{ color: '#888896', fontSize: '0.95rem', margin: '0 auto', maxWidth: '460px', lineHeight: 1.7 }}>
                  No algorithm. No feed. Just the things you actually follow, summarized and delivered before you start your day.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                {[
                  {
                    step: '1',
                    title: 'Add your sources',
                    body: 'Paste in any YouTube channel, podcast feed, newsletter, or blog. Morning Cup supports all the formats you already follow — no rethinking your reading habits.',
                  },
                  {
                    step: '2',
                    title: 'Tell us what matters',
                    body: 'Write a short prompt: "Focus on AI, skip the politics" or "I care about product strategy and startups." We use it to filter and frame every digest around what you actually want to know.',
                  },
                  {
                    step: '3',
                    title: 'Get your digest by 7 AM',
                    body: 'Every morning we read everything published in the last 24 hours, distill it to a five-minute brief, and send it to your inbox — ready before your first cup of coffee.',
                  },
                ].map((s) => (
                  <div key={s.step} style={{ background: '#0d0d0e', padding: '2.25rem 2rem' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(67,83,255,0.12)', border: '1px solid rgba(67,83,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', fontWeight: 600, color: '#4353FF',
                      marginBottom: '1.25rem',
                    }}>
                      {s.step}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#f0f0f2', margin: '0 0 0.65rem' }}>
                      {s.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#888896', margin: 0 }}>
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Divider */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>

            {/* Features */}
            <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 6rem) 2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', color: '#444450', margin: '0 0 1rem', textTransform: 'uppercase' }}>
                  What we cover
                </p>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0f0f2', margin: 0 }}>
                  Every format you already follow
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                {[
                  { n: '01', title: 'Newsletters', body: 'Forward any newsletter to your personal Morning Cup inbox and never miss an issue.' },
                  { n: '02', title: 'YouTube', body: 'Add any channel and get video summaries — no watching required.' },
                  { n: '03', title: 'Podcasts', body: 'Two-hour episodes distilled to three paragraphs with timestamps.' },
                  { n: '04', title: 'Blogs & RSS', body: 'Follow any blog or publication. Get the key points, not the scroll.' },
                ].map((f) => (
                  <div key={f.n} className="mc-feature-card">
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: '#4353FF', display: 'block', marginBottom: '1.25rem' }}>
                      {f.n}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#f0f0f2', margin: '0 0 0.65rem' }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#888896', margin: 0 }}>
                      {f.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Divider */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>

            {/* CTA */}
            <section style={{ maxWidth: '500px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 6rem) 2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0f0f2', margin: '0 0 0.75rem' }}>
                It&apos;s completely free.
              </h2>
              <p style={{ color: '#888896', fontSize: '0.9rem', margin: '0 0 2rem' }}>
                Sign up and get your first digest tomorrow morning.
              </p>
              <a href="/signup" className="mc-hero-cta" style={{ display: 'inline-flex' }}>
                Create free account →
              </a>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 700, color: '#f0f0f2' }}>Morning Cup</span>
                <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.65rem', color: '#444450' }}>© 2026 · New York, NY</span>
              </div>
            </footer>

          </>
        )}
      </div>
    </>
  )
}

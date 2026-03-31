'use client'

import { useState } from 'react'

function digestToHtml(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#92400e;text-decoration:underline;">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#1c1a17;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;margin:2rem 0 0.75rem;color:#1c1a17;">$1</h2>')
    .replace(/\n/g, '<br>')
}

const STATUS_COPY: Record<string, string> = {
  idle: 'SEND MY DIGEST',
  fetching: 'FETCHING YOUR SOURCES...',
  generating: 'READING EVERYTHING FOR YOU...',
  sending: 'SENDING TO YOUR INBOX...',
  done: 'SEND AGAIN',
  error: 'TRY AGAIN',
}

export default function DigestAction() {
  const [focus, setFocus] = useState('')
  const [status, setStatus] = useState<'idle' | 'fetching' | 'generating' | 'sending' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const isLoading = status === 'fetching' || status === 'generating' || status === 'sending'

  async function handleSend() {
    setStatus('fetching')
    setError('')
    setPreview('')

    try {
      const ingestRes = await fetch('/api/ingest', { method: 'POST' })
      if (!ingestRes.ok) {
        const d = await ingestRes.json()
        throw new Error(d.error ?? 'Failed to fetch sources')
      }

      setStatus('generating')
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: focus.trim() || undefined }),
      })
      const summarizeData = await summarizeRes.json()
      if (!summarizeRes.ok) throw new Error(summarizeData.error ?? 'Failed to generate digest')

      setStatus('sending')
      const sendRes = await fetch('/api/email-preview', { method: 'POST' })
      if (!sendRes.ok) {
        const d = await sendRes.json()
        throw new Error(d.error ?? 'Failed to send email')
      }

      setPreview(summarizeData.digest)
      setStatus('done')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div>
      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder="What topics matter to you? e.g. AI, climate tech, product design — leave blank for everything"
        rows={3}
        disabled={isLoading}
        className="mc-digest-textarea"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          color: '#ffffff',
          padding: '0.75rem 0',
          fontSize: '1rem',
          lineHeight: 1.65,
          fontFamily: 'var(--font-geist-sans)',
          resize: 'none',
          marginBottom: '2rem',
          outline: 'none',
        }}
      />

      <button
        onClick={handleSend}
        disabled={isLoading}
        style={{
          width: '100%',
          background: isLoading ? 'rgba(67,83,255,0.08)' : '#4353FF',
          color: isLoading ? 'rgba(255,255,255,0.25)' : '#ffffff',
          border: isLoading ? '1px solid rgba(67,83,255,0.15)' : 'none',
          padding: '1.1rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          fontFamily: 'var(--font-geist-mono)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'background 200ms ease-out, color 200ms ease-out, transform 160ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.background = '#5563FF'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.background = '#4353FF'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }
        }}
        onMouseDown={(e) => {
          if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(0.99)'
        }}
        onMouseUp={(e) => {
          if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }}
      >
        {STATUS_COPY[status]}
      </button>

      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '1rem', fontFamily: 'var(--font-geist-sans)', lineHeight: 1.5 }}>
          {error}
        </p>
      )}

      {status === 'done' && preview && (
        <div style={{ marginTop: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', color: '#3d3d3a', flexShrink: 0 }}>
              SENT · HERE&apos;S WHAT WE DELIVERED
            </span>
            <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{
            background: '#fffdf7',
            padding: '3rem 2.5rem',
            fontFamily: 'Georgia, serif',
            fontSize: '1rem',
            lineHeight: 1.8,
            color: '#2c2a25',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
          }}
            dangerouslySetInnerHTML={{ __html: `<p style="font-family:Georgia,serif;font-size:1.25rem;font-weight:bold;margin:0 0 1.5rem;color:#1c1a17;">Morning Cup ☕</p>${digestToHtml(preview)}` }}
          />
        </div>
      )}
    </div>
  )
}

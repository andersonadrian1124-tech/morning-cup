'use client'

import { useState } from 'react'

export default function DigestView() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [digest, setDigest] = useState('')
  const [error, setError] = useState('')
  const [focus, setFocus] = useState('')

  async function handleGenerate() {
    setStatus('loading')
    setError('')
    setDigest('')
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: focus.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setDigest(data.digest)
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
        placeholder={'What\'s on your mind today? (optional) \u2014 e.g. "focus on AI and ignore sports"'}
        rows={2}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          color: '#f0f0f2',
          padding: '0.85rem 1.25rem',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-geist-sans)',
          resize: 'none',
          outline: 'none',
          marginBottom: '1.25rem',
          lineHeight: 1.6,
        }}
      />

      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        style={{
          background: '#4353FF',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.7rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: 'var(--font-geist-sans)',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
          transition: 'background 160ms ease-out, opacity 160ms ease-out',
          marginBottom: '1.25rem',
        }}
      >
        {status === 'loading' ? 'Generating…' : 'Generate digest'}
      </button>

      {status === 'idle' && (
        <p style={{ color: '#555560', fontSize: '0.85rem', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-geist-sans)' }}>
          Fetch your sources first, then generate your morning digest.
        </p>
      )}

      {status === 'loading' && (
        <p style={{ color: '#888896', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-geist-sans)' }}>
          ☕ Claude is reading everything so you don&apos;t have to…
        </p>
      )}

      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-geist-sans)' }}>{error}</p>
      )}

      {status === 'done' && digest && (
        <div style={{
          color: '#d0d0d8',
          fontSize: '0.9rem',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-geist-sans)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.25rem',
        }}>
          {digest}
        </div>
      )}
    </div>
  )
}

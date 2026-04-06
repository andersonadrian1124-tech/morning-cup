'use client'

import { useState } from 'react'

export default function FetchButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleFetch() {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/ingest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setStatus('done')
      setMessage(`Fetched ${data.inserted} new items`)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        onClick={handleFetch}
        disabled={status === 'loading'}
        style={{
          background: '#4353FF',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.45rem 1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--font-geist-sans)',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
          transition: 'background 160ms ease-out, opacity 160ms ease-out',
          letterSpacing: '0.01em',
        }}
      >
        {status === 'loading' ? 'Fetching…' : 'Fetch latest'}
      </button>
      {message && (
        <span style={{
          fontSize: '0.78rem',
          fontFamily: 'var(--font-geist-mono)',
          color: status === 'error' ? '#f87171' : '#888896',
        }}>
          {message}
        </span>
      )}
    </div>
  )
}

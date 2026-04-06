'use client'

import { useState } from 'react'

export default function EmailTestButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSendTest() {
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/email-preview', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setStatus('sent')
      setMessage(`Sent to ${data.to}`)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const ghostBtn: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#888896',
    padding: '0.55rem 1.1rem',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-geist-sans)',
    cursor: 'pointer',
    transition: 'border-color 160ms ease-out, color 160ms ease-out',
    textDecoration: 'none',
    display: 'inline-block',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <a
        href="/api/email-preview"
        target="_blank"
        rel="noopener noreferrer"
        style={ghostBtn}
      >
        Preview email
      </a>
      <button
        onClick={handleSendTest}
        disabled={status === 'sending'}
        style={{
          ...ghostBtn,
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          opacity: status === 'sending' ? 0.6 : 1,
        }}
      >
        {status === 'sending' ? 'Sending…' : 'Send test to me'}
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

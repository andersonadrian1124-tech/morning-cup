'use client'

import { useState } from 'react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError('Something went wrong, try again.')
      }
    } catch {
      setError('Something went wrong, try again.')
    }
  }

  if (submitted) {
    return (
      <div style={{
        background: 'rgba(67,83,255,0.1)',
        border: '1px solid rgba(67,83,255,0.25)',
        borderRadius: '8px',
        padding: '1.25rem',
        textAlign: 'center',
      }}>
        <p style={{ color: '#4353FF', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-geist-sans)', fontWeight: 500 }}>
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleWaitlist} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mc-input-waitlist"
      />
      <button
        type="submit"
        style={{
          width: '100%',
          background: '#4353FF',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.875rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: 'var(--font-geist-sans)',
          cursor: 'pointer',
          transition: 'background 160ms ease-out',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#5563FF')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#4353FF')}
      >
        Get early access
      </button>
      {error && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--font-geist-sans)' }}>
          {error}
        </p>
      )}
    </form>
  )
}

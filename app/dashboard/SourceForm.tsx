'use client'

import { useState } from 'react'
import { addSource } from '@/app/actions'

const SOURCE_TYPES = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'rss', label: 'Blog / RSS' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  color: '#ddd8cf',
  padding: '0.65rem 0',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-geist-sans)',
  outline: 'none',
}

export default function SourceForm() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('newsletter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await addSource(formData)
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setType('newsletter')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#4a4a47',
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          cursor: 'pointer',
          padding: '1rem 0 0',
          transition: 'color 160ms ease-out',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#9a9994')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4a47')}
      >
        + ADD A SOURCE
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SOURCE_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            style={{
              background: type === t.value ? '#ddd8cf' : 'transparent',
              color: type === t.value ? '#0c0c0b' : '#4a4a47',
              border: '1px solid',
              borderColor: type === t.value ? '#ddd8cf' : 'rgba(255,255,255,0.08)',
              padding: '0.4rem 0.9rem',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-geist-mono)',
              cursor: 'pointer',
              transition: 'background 160ms ease-out, color 160ms ease-out, border-color 160ms ease-out',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input type="hidden" name="type" value={type} />

      <input
        name="url"
        type="url"
        required
        placeholder={
          type === 'youtube' ? 'https://youtube.com/@channel' :
          type === 'podcast' ? 'Podcast RSS or Apple Podcasts URL' :
          type === 'newsletter' ? 'Newsletter URL or homepage' :
          'https://example.com/feed'
        }
        style={inputStyle}
      />

      <input
        name="name"
        type="text"
        placeholder="Name (optional)"
        style={{ ...inputStyle, marginBottom: '0.5rem' }}
      />

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--font-geist-sans)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#ddd8cf',
            color: '#0c0c0b',
            border: 'none',
            padding: '0.65rem 1.5rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            fontFamily: 'var(--font-geist-mono)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 160ms ease-out, background 160ms ease-out',
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = '#f0ece4') }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = '#ddd8cf') }}
        >
          {loading ? 'ADDING...' : 'ADD SOURCE'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a4a47',
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'color 160ms ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#9a9994')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4a47')}
        >
          CANCEL
        </button>
      </div>
    </form>
  )
}

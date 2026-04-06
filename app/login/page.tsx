'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#f0f0f2',
    padding: '0.85rem 1.25rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ background: '#111112', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '3rem 2.5rem', width: '100%', maxWidth: '420px' }}>

        <a href="/" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Morning Cup</span>
        </a>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#f0f0f2', margin: '0 0 0.4rem', textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ color: '#888896', fontSize: '0.875rem', textAlign: 'center', margin: '0 0 2rem' }}>
          Sign in to your Morning Cup
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#4353FF',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.85rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: '0.25rem',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#888896', margin: '1.5rem 0 0' }}>
          No account?{' '}
          <a href="/signup" style={{ color: '#f0f0f2', textDecoration: 'underline' }}>Sign up</a>
        </p>
      </div>
    </main>
  )
}

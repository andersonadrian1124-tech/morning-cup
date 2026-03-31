'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function HomeSignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
      })

      if (error) {
        setError(error.message)
      } else {
        setDone(true)
      }
    } catch {
      setError('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ color: '#888896', fontSize: '0.9rem', lineHeight: 1.7 }}>
        <p style={{ color: '#f0f0f2', fontWeight: 600, marginBottom: '0.5rem' }}>Check your email.</p>
        We sent a confirmation link to <strong style={{ color: '#f0f0f2' }}>{email}</strong>.<br />
        Click it to activate your account and start your free trial.
      </div>
    )
  }

  return (
    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mc-input-waitlist"
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="mc-input-waitlist"
      />
      {error && (
        <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0, textAlign: 'left' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mc-hero-cta"
        style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Creating account…' : 'Start free trial →'}
      </button>
      <p style={{ color: '#444450', fontSize: '0.75rem', margin: 0 }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#888896', textDecoration: 'underline' }}>Sign in</a>
      </p>
    </form>
  )
}

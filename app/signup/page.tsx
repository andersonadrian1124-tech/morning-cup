'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
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
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
      })

      if (error) {
        setError(error.message)
      } else {
        setDone(true)
      }
    } catch (err) {
      setError('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">☕</div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Check your email</h1>
          <p className="text-amber-700 text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-amber-900 mb-2 text-center">Create your account</h1>
        <p className="text-amber-700 text-center mb-6 text-sm">Start your free 7-day trial</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-900"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-900"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-900 text-white py-3 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-amber-700 mt-4">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-amber-900 underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  )
}

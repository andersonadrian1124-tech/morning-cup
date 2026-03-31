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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleGenerate}
          disabled={status === 'loading'}
          className="text-sm bg-amber-900 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
        >
          {status === 'loading' ? 'Generating...' : 'Generate digest'}
        </button>
      </div>

      <textarea
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        placeholder={'What\'s on your mind today? (optional) \u2014 e.g. "focus on AI and ignore sports"'}
        rows={2}
        className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:border-amber-900 resize-none mb-4"
      />

      {status === 'idle' && (
        <p className="text-amber-600 text-sm">Fetch your sources first, then generate your morning digest.</p>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <span className="animate-spin">☕</span>
          <span>Claude is reading everything so you don't have to...</span>
        </div>
      )}

      {status === 'error' && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {status === 'done' && digest && (
        <div className="prose prose-sm prose-amber max-w-none text-amber-900 leading-relaxed whitespace-pre-wrap">
          {digest}
        </div>
      )}
    </div>
  )
}

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
    <div className="flex items-center gap-3">
      <button
        onClick={handleFetch}
        disabled={status === 'loading'}
        className="text-sm bg-amber-900 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
      >
        {status === 'loading' ? 'Fetching...' : 'Fetch latest'}
      </button>
      {message && (
        <span className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-amber-600'}`}>
          {message}
        </span>
      )}
    </div>
  )
}

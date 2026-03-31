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

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <a
        href="/api/email-preview"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm border border-amber-300 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-50 transition"
      >
        Preview email
      </a>
      <button
        onClick={handleSendTest}
        disabled={status === 'sending'}
        className="text-sm border border-amber-300 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-50 transition disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending...' : 'Send test to me'}
      </button>
      {message && (
        <span className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-amber-600'}`}>
          {message}
        </span>
      )}
    </div>
  )
}

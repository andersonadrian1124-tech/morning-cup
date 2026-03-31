import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { deleteSource } from '@/app/actions'
import SourceForm from './SourceForm'
import FetchButton from './FetchButton'
import DigestView from './DigestView'
import EmailTestButton from './EmailTestButton'

const TYPE_ICONS: Record<string, string> = {
  youtube: '📺',
  rss: '📡',
  podcast: '🎙️',
  newsletter: '📧',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold text-amber-900">Morning Cup ☕</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-amber-700 hover:text-amber-900 underline"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-1">Welcome!</h2>
          <p className="text-amber-700 text-sm">{user.email}</p>
        </div>

        {/* Sources */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-900">Your sources</h2>
            {sources && sources.length > 0 && <FetchButton />}
          </div>

          {sources && sources.length > 0 ? (
            <ul className="flex flex-col gap-3 mb-4">
              {sources.map((source) => (
                <li key={source.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{TYPE_ICONS[source.type] ?? '🔗'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-amber-900 truncate">{source.name}</p>
                      <p className="text-xs text-amber-600 truncate">{source.url}</p>
                    </div>
                  </div>
                  <form action={deleteSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="text-xs text-amber-400 hover:text-red-500 transition shrink-0"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-amber-600 text-sm mb-4">No sources yet — add one below.</p>
          )}

          <SourceForm />
        </div>

        <DigestView />

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-900 mb-4">Email testing</h2>
          <EmailTestButton />
        </div>

      </div>
    </main>
  )
}

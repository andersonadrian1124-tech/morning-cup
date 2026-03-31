import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    'https://vzkprljtoymokpkqviji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a3BybGp0b3ltb2twa3F2aWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjQ2NTcsImV4cCI6MjA5MDA0MDY1N30.9JxrzFUVkqC64r9kpfxxNpD2OGyOAsRbayilVGaQLig',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

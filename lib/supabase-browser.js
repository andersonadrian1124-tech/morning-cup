import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://vzkprljtoymokpkqviji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a3BybGp0b3ltb2twa3F2aWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjQ2NTcsImV4cCI6MjA5MDA0MDY1N30.9JxrzFUVkqC64r9kpfxxNpD2OGyOAsRbayilVGaQLig'
  )
}

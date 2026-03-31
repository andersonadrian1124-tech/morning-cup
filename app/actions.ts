'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function addSource(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const type = formData.get('type') as string
  const url = formData.get('url') as string
  const name = formData.get('name') as string

  const { error } = await supabase.from('sources').insert({
    user_id: user.id,
    type,
    url,
    name: name || url,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export async function deleteSource(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
}

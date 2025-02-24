import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie error
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie error
          }
        },
      },
    }
  )
}

export async function createContractor({
  email,
  password,
  name,
  companyName,
  phoneNumber,
}: {
  email: string
  password: string
  name: string
  companyName: string
  phoneNumber: string
}) {
  const supabase = createClient()

  // First, create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // Then, insert the additional contractor details
  const { data: profileData, error: profileError } = await supabase
    .from('contractors')
    .insert([
      {
        id: authData.user?.id,
        name,
        company_name: companyName,
        phone_number: phoneNumber,
        email,
      },
    ])
    .select()
    .single()

  if (profileError) {
    // If profile creation fails, we should ideally delete the auth user
    // but Supabase doesn't provide a direct way to do this from the client
    throw profileError
  }

  return profileData
}

export async function validateContractor(email: string, password: string) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) throw authError

  // Get the contractor profile
  const { data: contractor, error: profileError } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  return contractor
}

export async function verifySession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }

  return session
}

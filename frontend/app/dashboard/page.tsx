import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, role, org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Failed to load dashboard profile', {
      code: profileError.code,
      message: profileError.message,
    })
  }

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      {profileError ? (
        <p role="alert" className="text-red-600">
          We could not load your profile. Please refresh the page and try again.
        </p>
      ) : !profile ? (
        <p role="alert" className="text-red-600">
          Your account is signed in, but its profile setup is incomplete.
        </p>
      ) : (
        <div className="space-y-1">
          <p>Logged in as: {profile.email}</p>
          <p>Role: {profile.role}</p>
          <p>Org ID: {profile.org_id}</p>
          <a
            href="/dashboard/campaigns"
            className="inline-block mt-4 bg-black text-white rounded px-4 py-2 text-sm"
          >
            View Campaigns →
          </a>
        </div>
      )}
    </div>
  )
}

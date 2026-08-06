'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('create_org_and_profile', {
      org_name_input: orgName,
      user_email_input: email,
    })

    if (rpcError) {
      setError(`Account created but org setup failed: ${rpcError.message}`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-xl font-semibold mb-4">Create Account</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Organization / Business Name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
          minLength={6}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
      <p className="text-sm mt-3">
        Already have an account? <a href="/login" className="underline">Log in</a>
      </p>
    </div>
  )
}

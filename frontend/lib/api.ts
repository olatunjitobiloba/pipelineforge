import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthHeader() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) throw new Error('Not authenticated')

  return { Authorization: `Bearer ${token}` }
}

export interface Campaign {
  id: string
  org_id: string
  name: string
  niche: string
  city: string
  min_service_value: number | null
  exclusion_criteria: string[]
  outreach_angle: string | null
  objective: string | null
  status: 'active' | 'paused' | 'archived'
  created_at: string
  updated_at: string
}

export interface CampaignCreateInput {
  name: string
  niche: string
  city: string
  min_service_value?: number
  outreach_angle?: string
  objective?: string
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/campaigns`, { headers })

  if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`)
  return res.json()
}

export async function createCampaign(input: CampaignCreateInput): Promise<Campaign> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to create campaign: ${res.status}`)
  }
  return res.json()
}

export async function updateCampaignStatus(
  id: string,
  status: 'active' | 'paused' | 'archived'
): Promise<Campaign> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!res.ok) throw new Error(`Failed to update campaign: ${res.status}`)
  return res.json()
}

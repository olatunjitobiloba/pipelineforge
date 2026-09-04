import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthHeader() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) throw new Error('Not authenticated')

  return { Authorization: `Bearer ${token}` }
}

async function getAuthHeaders() {
  return getAuthHeader()
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
  const res = await fetch('/api/campaigns', { headers })

  if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`)
  return res.json()
}

export async function createCampaign(input: CampaignCreateInput): Promise<Campaign> {
  const headers = await getAuthHeader()
  const res = await fetch('/api/campaigns', {
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
  const res = await fetch(`/api/campaigns/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!res.ok) throw new Error(`Failed to update campaign: ${res.status}`)
  return res.json()
}

export interface Prospect {
  id: string
  org_id: string
  campaign_id: string
  business_name: string
  website_url: string | null
  phone: string | null
  email: string | null
  location: string | null
  stage: string
  score: number | null
  data_source: string
  human_verified: boolean
  created_at: string
  updated_at: string
}

export interface CSVImportResult {
  inserted: number
  skipped: number
  errors: string[]
}

export async function listProspects(campaignId: string): Promise<Prospect[]> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ campaign_id: campaignId })
  const res = await fetch(`${API_URL}/prospects?${params}`, { headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Failed to fetch prospects: ${res.status}`)
  }
  return res.json()
}

export async function createProspect(data: {
  campaign_id: string
  business_name: string
  phone?: string
  email?: string
  website_url?: string
  location?: string
  data_source?: string
}): Promise<Prospect> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/prospects`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, data_source: data.data_source ?? 'manual' }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to create prospect')
  }
  return res.json()
}

export async function importProspectsCSV(
  campaignId: string,
  file: File
): Promise<CSVImportResult> {
  const headers = await getAuthHeaders()
  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams({ campaign_id: campaignId })
  const res = await fetch(`${API_URL}/prospects/import/csv?${params}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail?.message ?? err.detail ?? 'Import failed')
  }
  return res.json()
}

export async function deleteProspect(prospectId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/prospects/${encodeURIComponent(prospectId)}`, {
    method: 'DELETE',
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to delete prospect')
  }
}

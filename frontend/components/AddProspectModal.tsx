'use client'
import { useState } from 'react'
import { createProspect, Prospect } from '@/lib/api'

interface Props {
  campaignId: string
  onSuccess: (prospect: Prospect) => void
  onClose: () => void
}

export default function AddProspectModal({ campaignId, onSuccess, onClose }: Props) {
  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    email: '',
    website_url: '',
    location: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const created = await createProspect({
        campaign_id: campaignId,
        business_name: form.business_name,
        ...(form.phone.trim() ? { phone: form.phone } : {}),
        ...(form.email.trim() ? { email: form.email } : {}),
        ...(form.website_url.trim() ? { website_url: form.website_url } : {}),
        ...(form.location.trim() ? { location: form.location } : {}),
      })
      onSuccess(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add prospect')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Prospect</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input placeholder="Business name *" value={form.business_name}
            onChange={e => set('business_name', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder:text-gray-500" required />
          <input placeholder="Phone" value={form.phone}
            onChange={e => set('phone', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder:text-gray-500" />
          <input placeholder="Email" type="email" value={form.email}
            onChange={e => set('email', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder:text-gray-500" />
          <input placeholder="Website URL" value={form.website_url}
            onChange={e => set('website_url', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder:text-gray-500" />
          <input placeholder="Location / City" value={form.location}
            onChange={e => set('location', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder:text-gray-500" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border rounded px-3 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-black text-white rounded px-3 py-2 text-sm disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

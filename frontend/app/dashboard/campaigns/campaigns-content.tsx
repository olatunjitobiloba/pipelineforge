'use client'
import { useEffect, useState } from 'react'
import { fetchCampaigns, createCampaign, updateCampaignStatus, type Campaign } from '@/lib/api'

export default function CampaignsContent() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null)

    async function loadCampaigns() {
        setLoading(true)
        setError('')
        try {
            const data = await fetchCampaigns()
            setCampaigns(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load campaigns')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let cancelled = false

        fetchCampaigns()
            .then((data) => {
                if (!cancelled) setCampaigns(data)
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Failed to load campaigns')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    async function handleStatusToggle(campaign: Campaign) {
        if (updatingCampaignId) return

        const newStatus = campaign.status === 'active' ? 'paused' : 'active'
        setError('')
        setUpdatingCampaignId(campaign.id)
        setCampaigns((currentCampaigns) =>
            currentCampaigns.map((currentCampaign) =>
                currentCampaign.id === campaign.id
                    ? { ...currentCampaign, status: newStatus }
                    : currentCampaign,
            ),
        )

        try {
            await updateCampaignStatus(campaign.id, newStatus)
        } catch (e) {
            setCampaigns((currentCampaigns) =>
                currentCampaigns.map((currentCampaign) =>
                    currentCampaign.id === campaign.id
                        ? { ...currentCampaign, status: campaign.status }
                        : currentCampaign,
                ),
            )
            setError(e instanceof Error ? e.message : 'Update failed')
        } finally {
            setUpdatingCampaignId(null)
        }
    }

    return (
        <div className="max-w-3xl mx-auto mt-12 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Campaigns</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white rounded px-4 py-2 text-sm"
                >
                    {showForm ? 'Cancel' : '+ New Campaign'}
                </button>
            </div>

            {showForm && (
                <CampaignForm
                    onCreated={() => {
                        setShowForm(false)
                        loadCampaigns()
                    }}
                    onError={setError}
                />
            )}

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : campaigns.length === 0 ? (
                <p className="text-sm text-gray-500">No campaigns yet. Create your first one above.</p>
            ) : (
                <div className="space-y-3">
                    {campaigns.map((c) => (
                        <div key={c.id} className="border rounded-lg p-4 flex justify-between items-start">
                            <div>
                                <h3>
                                    <a href={`/dashboard/campaigns/${c.id}/prospects`} className="font-medium hover:underline">
                                        {c.name}
                                    </a>
                                </h3>
                                <p className="text-sm text-gray-500">{c.niche} · {c.city}</p>
                                {c.outreach_angle && (
                                    <p className="text-sm text-gray-400 mt-1">{c.outreach_angle}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span
                                    className={`text-xs px-2 py-1 rounded ${c.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : c.status === 'paused'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                >
                                    {c.status}
                                </span>
                                {c.status !== 'archived' && (
                                    <button
                                        type="button"
                                        disabled={updatingCampaignId === c.id}
                                        onClick={() => handleStatusToggle(c)}
                                        aria-busy={updatingCampaignId === c.id}
                                        className="cursor-pointer rounded px-2 py-1 text-xs text-gray-600 underline decoration-transparent transition hover:bg-gray-100 hover:text-gray-950 hover:decoration-current active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-wait disabled:opacity-60"
                                    >
                                        {updatingCampaignId === c.id
                                            ? c.status === 'active' ? 'Pausing...' : 'Activating...'
                                            : c.status === 'active' ? 'Pause' : 'Activate'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function CampaignForm({
    onCreated,
    onError,
}: {
    onCreated: () => void
    onError: (msg: string) => void
}) {
    const [name, setName] = useState('')
    const [niche, setNiche] = useState('')
    const [city, setCity] = useState('')
    const [minServiceValue, setMinServiceValue] = useState('')
    const [outreachAngle, setOutreachAngle] = useState('')
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        onError('')
        try {
            await createCampaign({
                name,
                niche,
                city,
                min_service_value: minServiceValue ? Number(minServiceValue) : undefined,
                outreach_angle: outreachAngle || undefined,
            })
            onCreated()
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Failed to create campaign')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 space-y-3">
            <input
                placeholder="Campaign name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
            />
            <div className="flex gap-3">
                <input
                    placeholder="Niche (e.g. roofing)"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="border rounded px-3 py-2 flex-1"
                    required
                />
                <input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="border rounded px-3 py-2 flex-1"
                    required
                />
            </div>
            <input
                type="number"
                placeholder="Min service value (optional)"
                value={minServiceValue}
                onChange={(e) => setMinServiceValue(e.target.value)}
                className="border rounded px-3 py-2 w-full"
            />
            <textarea
                placeholder="Outreach angle (optional)"
                value={outreachAngle}
                onChange={(e) => setOutreachAngle(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                rows={2}
            />
            <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            >
                {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
        </form>
    )
}

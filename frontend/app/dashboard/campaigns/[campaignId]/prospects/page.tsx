'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { deleteProspect, listProspects, type Prospect } from '@/lib/api'
import StageBadge from '@/components/StageBadge'
import CSVUpload from '@/components/CSVUpload'
import AddProspectModal from '@/components/AddProspectModal'

export default function ProspectsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProspects(await listProspects(campaignId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load prospects')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  async function handleDelete(prospect: Prospect) {
    if (!window.confirm(`Delete ${prospect.business_name}?`)) return

    setDeletingId(prospect.id)
    setError('')
    try {
      await deleteProspect(prospect.id)
      setProspects((current) => current.filter((item) => item.id !== prospect.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete prospect')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    const loadProspects = async () => {
      await load()
    }
    void loadProspects()
  }, [load])

  return (
    <div className="mx-auto mt-10 max-w-4xl p-6 text-center">
      <div className="mb-6 flex flex-col items-center gap-4">
        <div>
          <a href="/dashboard/campaigns" className="inline-block text-sm text-gray-400 hover:underline">
            Back to campaigns
          </a>
          <h1 className="mt-1 text-2xl font-semibold">Prospects</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => { setShowUpload(!showUpload); setShowAddModal(false) }} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm !text-black hover:bg-gray-100 hover:!text-black">
            Import CSV
          </button>
          <button onClick={() => { setShowAddModal(true); setShowUpload(false) }} className="rounded bg-black px-3 py-2 text-sm !text-white hover:bg-gray-900 hover:!text-white">
            + Add Prospect
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="mb-6 rounded-lg border p-4">
          <CSVUpload campaignId={campaignId} onSuccess={() => { void load() }} />
        </div>
      )}
      {showAddModal && (
        <AddProspectModal campaignId={campaignId} onSuccess={() => void load()} onClose={() => setShowAddModal(false)} />
      )}
      {error && <p className="mb-4 text-sm text-gray-300">{error}</p>}

      {!loading && prospects.length > 0 && (
        <div className="mb-4 flex justify-center gap-4 text-sm text-gray-300">
          <span>{prospects.length} total</span>
          <span>{prospects.filter((p) => p.stage === 'new').length} new</span>
          <span>{prospects.filter((p) => p.stage === 'won').length} won</span>
          <span>{prospects.filter((p) => p.score !== null).length} scored</span>
        </div>
      )}

      {loading ? <p className="text-sm text-gray-400">Loading...</p> : prospects.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm">No prospects yet.</p>
          <p className="mt-1 text-xs">Import a CSV or add one manually.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-white">
            <thead><tr className="border-b text-center text-gray-300">
              <th className="py-2 pr-4 font-medium">Business</th>
              <th className="py-2 pr-4 font-medium">Location</th>
              <th className="py-2 pr-4 font-medium">Contact</th>
              <th className="py-2 pr-4 font-medium">Stage</th>
              <th className="py-2 pr-4 font-medium">Score</th>
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 font-medium">Actions</th>
            </tr></thead>
            <tbody className="text-gray-900">{prospects.map((prospect) => (
              <tr key={prospect.id} className="border-b border-gray-800 !text-white hover:bg-gray-900">
                <td className="py-3 pr-4 !text-white"><div className="font-medium">{prospect.business_name}</div>
                  {prospect.website_url && <a href={prospect.website_url.startsWith('http') ? prospect.website_url : `https://${prospect.website_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-white hover:underline">{prospect.website_url.replace(/^https?:\/\//, '')}</a>}
                </td>
                <td className="py-3 pr-4 !text-gray-200">{prospect.location ?? '-'}</td>
                <td className="py-3 pr-4 !text-white"><div className="text-gray-200">{prospect.phone ?? '-'}</div>{prospect.email && <div className="text-xs text-gray-300">{prospect.email}</div>}</td>
                <td className="py-3 pr-4"><StageBadge stage={prospect.stage} /></td>
                <td className="py-3 pr-4">{prospect.score !== null ? prospect.score : <span className="text-gray-300">-</span>}</td>
                <td className="py-3 pr-4 text-xs text-gray-300">{prospect.data_source}</td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => void handleDelete(prospect)}
                    disabled={deletingId === prospect.id}
                    className="rounded border border-red-400 px-2 py-1 text-xs !text-red-400 hover:bg-red-950 hover:!text-red-300 disabled:opacity-50"
                  >
                    {deletingId === prospect.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

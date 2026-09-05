'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  listProspects, scoreProspect, scoreCampaign, deleteProspect, Prospect
} from '@/lib/api'
import StageBadge      from '@/components/StageBadge'
import ScoreBar        from '@/components/ScoreBar'
import ScoreBreakdown  from '@/components/ScoreBreakdown'
import ScoreSummary    from '@/components/ScoreSummary'
import CSVUpload       from '@/components/CSVUpload'
import AddProspectModal from '@/components/AddProspectModal'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ProspectsPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [prospects, setProspects]     = useState<Prospect[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [showUpload, setShowUpload]   = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Bulk scoring state
  const [scoring, setScoring]         = useState(false)
  const [scoreMsg, setScoreMsg]       = useState('')

  // Per-row scoring state
  const [scoringRow, setScoringRow]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    if (!UUID_PATTERN.test(campaignId)) {
      setError('Invalid campaign link. Return to Campaigns and open a campaign from the list.')
      setLoading(false)
      return
    }

    try {
      setProspects(await listProspects(campaignId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { load() }, [load])

  // ── Score All ──────────────────────────────────────────────
  async function handleScoreAll() {
    setScoring(true)
    setScoreMsg('')
    try {
      const res = await scoreCampaign(campaignId)
      setScoreMsg(
        res.scored === 0
          ? 'All prospects already scored.'
          : `✓ Scored ${res.scored} of ${res.total} prospects.${
              res.errors.length ? ` ${res.errors.length} failed.` : ''
            }`
      )
      await load()
    } catch (e) {
      setScoreMsg(e instanceof Error ? e.message : 'Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  // ── Score Single Row ───────────────────────────────────────
  async function handleScoreOne(prospectId: string) {
    setScoringRow(prospectId)
    try {
      const updated = await scoreProspect(prospectId)
      setProspects(prev =>
        prev.map(p => p.id === prospectId ? { ...p, ...updated } : p)
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Scoring failed')
    } finally {
      setScoringRow(null)
    }
  }

  async function handleDelete(prospect: Prospect) {
    if (!window.confirm(`Delete ${prospect.business_name}?`)) return

    try {
      await deleteProspect(prospect.id)
      setProspects(prev => prev.filter(p => p.id !== prospect.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const unscored = prospects.filter(p => p.score === null).length

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <a href="/dashboard/campaigns" className="text-sm text-gray-400 hover:underline">
            ← Campaigns
          </a>
          <h1 className="text-2xl font-semibold mt-1">Prospects</h1>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {unscored > 0 && (
            <button
              onClick={handleScoreAll}
              disabled={scoring}
              className="bg-gray-800 text-white rounded px-3 py-2 text-sm disabled:opacity-50 hover:bg-gray-700 transition-colors"
            >
              {scoring ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Scoring...
                </span>
              ) : `Score All (${unscored})`}
            </button>
          )}
          <button
            onClick={() => { setShowUpload(!showUpload); setShowAddModal(false) }}
            className="border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Import CSV
          </button>
          <button
            onClick={() => { setShowAddModal(true); setShowUpload(false) }}
            className="bg-black text-white rounded px-3 py-2 text-sm"
          >
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Score All feedback */}
      {scoreMsg && (
        <div className="mb-4 text-sm text-gray-200 bg-gray-900 border border-gray-700 rounded px-3 py-2 animate-pulse">
          {scoreMsg}
        </div>
      )}

      {/* CSV Upload Panel */}
      {showUpload && (
        <div className="mb-6 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-medium text-sm">Import from CSV</h2>
            <button onClick={() => setShowUpload(false)} className="text-xs text-gray-400 hover:underline">
              Close
            </button>
          </div>
          <CSVUpload
            campaignId={campaignId}
            onSuccess={() => { load(); setShowUpload(false) }}
          />
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProspectModal
          campaignId={campaignId}
          onSuccess={created => setProspects(prev => [created, ...prev])}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Score Summary Cards */}
      <ScoreSummary prospects={prospects} />

      {/* Stats bar */}
      {!loading && prospects.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm text-gray-500">
          <span>{prospects.length} total</span>
          <span>{prospects.filter(p => p.stage === 'new').length} new</span>
          <span>{prospects.filter(p => p.score !== null).length} scored</span>
          <span>{prospects.filter(p => p.stage === 'won').length} won</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : prospects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No prospects yet.</p>
          <p className="text-xs mt-1">Import a CSV or add one manually.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm text-gray-200 border-collapse">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[13%]" />
              <col className="w-[22%]" />
              <col className="w-[13%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b text-left text-gray-400">
                <th className="px-2 py-2 font-medium">Business</th>
                <th className="px-2 py-2 font-medium">Location</th>
                <th className="px-2 py-2 font-medium">Contact</th>
                <th className="px-2 py-2 font-medium">Stage</th>
                <th className="px-2 py-2 font-medium">Score</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => (
                <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                  <td className="px-2 py-3">
                    <div className="font-medium">{p.business_name}</div>
                    {p.website_url && (
                      <a
                        href={p.website_url.startsWith('http') ? p.website_url : `https://${p.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-white hover:underline"
                      >
                        {p.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </td>
                  <td className="px-2 py-3 text-gray-300">{p.location ?? '—'}</td>
                  <td className="px-2 py-3">
                    <div className="text-gray-300">{p.phone ?? '—'}</div>
                    {p.email && <div className="text-xs text-gray-500">{p.email}</div>}
                  </td>
                  <td className="px-2 py-3">
                    <StageBadge stage={p.stage} />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-col gap-1">
                      <ScoreBar score={p.score} />
                      <ScoreBreakdown
                        breakdown={(p as Prospect & { score_breakdown?: any }).score_breakdown}
                        engine={(p as Prospect & { score_breakdown?: any }).score_breakdown?.engine}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {p.score === null ? (
                        <button
                          onClick={() => handleScoreOne(p.id)}
                          disabled={scoringRow === p.id}
                          className="text-xs text-gray-300 hover:text-white hover:underline disabled:opacity-40"
                        >
                          {scoringRow === p.id ? 'Scoring...' : 'Score'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleScoreOne(p.id)}
                          disabled={scoringRow === p.id}
                          className="text-xs text-gray-500 hover:text-gray-900 hover:underline disabled:opacity-40"
                        >
                          {scoringRow === p.id ? 'Scoring...' : 'Re-score'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

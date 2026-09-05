import { Prospect } from '@/lib/api'

interface Props {
  prospects: Prospect[]
}

export default function ScoreSummary({ prospects }: Props) {
  const scored = prospects.filter(p => p.score !== null)
  if (scored.length === 0) return null

  const strong   = scored.filter(p => p.score! >= 70).length
  const moderate = scored.filter(p => p.score! >= 40 && p.score! < 70).length
  const weak     = scored.filter(p => p.score! < 40).length
  const avg      = Math.round(scored.reduce((s, p) => s + p.score!, 0) / scored.length)

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Avg Score',  value: avg,      color: 'text-gray-200' },
        { label: 'Strong',     value: strong,   color: 'text-green-600' },
        { label: 'Moderate',   value: moderate, color: 'text-gray-300' },
        { label: 'Weak',       value: weak,     color: 'text-gray-500' },
      ].map(({ label, value, color }) => (
        <div key={label} className="border rounded-lg p-3 text-center">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
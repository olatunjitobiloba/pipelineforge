interface Props {
  score: number | null
}

export default function ScoreBar({ score }: Props) {
  if (score === null) {
    return <span className="text-gray-300 text-sm">—</span>
  }

  const color =
    score >= 70 ? 'bg-green-500' :
    score >= 40 ? 'bg-yellow-400' :
                 'bg-red-400'

  const label =
    score >= 70 ? 'text-green-700' :
    score >= 40 ? 'text-yellow-700' :
                 'text-red-600'

  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`score-bar-fill h-1.5 rounded-full ${color}`}
          style={{ '--score-width': `${score}%` } as React.CSSProperties}
        />
      </div>
      <span className={`text-xs font-semibold w-6 text-right ${label}`}>
        {score}
      </span>
    </div>
  )
}
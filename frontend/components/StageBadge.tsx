export default function StageBadge({ stage }: { stage: string }) {
  return (
    <span className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-200">
      {stage}
    </span>
  )
}
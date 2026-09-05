'use client'
import { useState } from 'react'

interface Breakdown {
  has_website: boolean
  has_phone: boolean
  has_email: boolean
  has_location: boolean
  name_clarity: 'clear' | 'generic' | 'vague'
  reasoning: string
}

interface Props {
  breakdown: Breakdown | null
  engine?: string
}

const Check = () => <span className="text-green-500">✓</span>
const Cross = () => <span className="text-red-400">✗</span>

export default function ScoreBreakdown({ breakdown, engine }: Props) {
  const [open, setOpen] = useState(false)

  if (!breakdown) return null

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2"
      >
        details
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Tooltip card */}
          <div className="absolute z-20 left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg p-3 text-xs">
            <div className="space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Website</span>
                {breakdown.has_website ? <Check /> : <Cross />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                {breakdown.has_phone ? <Check /> : <Cross />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                {breakdown.has_email ? <Check /> : <Cross />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                {breakdown.has_location ? <Check /> : <Cross />}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name clarity</span>
                <span className="capitalize text-gray-700">{breakdown.name_clarity}</span>
              </div>
            </div>
            <p className="text-gray-500 border-t pt-2 leading-relaxed">
              {breakdown.reasoning}
            </p>
            {engine && (
              <p className="text-gray-300 mt-1">
                engine: {engine}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

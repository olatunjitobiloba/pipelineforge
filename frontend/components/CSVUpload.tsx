'use client'
import { useState, useRef } from 'react'
import { importProspectsCSV, CSVImportResult } from '@/lib/api'

interface Props {
  campaignId: string
  onSuccess: () => void
}

export default function CSVUpload({ campaignId, onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<CSVImportResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are accepted')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      const res = await importProspectsCSV(campaignId, file)
      setResult(res)
      if (res.inserted > 0) onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="mt-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop CSV here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">
              Required column: business_name (or &quot;company&quot;, &quot;name&quot;)
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-gray-300">{error}</p>
      )}

      {result && (
        <div className="mt-3 rounded border border-gray-700 bg-gray-900 p-3 text-sm text-gray-100">
          <p className="font-medium text-gray-100">
            {result.inserted} prospect{result.inserted !== 1 ? 's' : ''} imported
          </p>
          {result.skipped > 0 && (
            <p className="mt-1 text-gray-300">{result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped</p>
          )}
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-300">
                View skipped rows ({result.errors.length})
              </summary>
              <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-gray-300">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

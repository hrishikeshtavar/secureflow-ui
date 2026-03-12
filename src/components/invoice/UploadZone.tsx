import { useCallback, useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { useInvoiceStore } from '@/store'

export default function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const { uploadInvoice, isScanning } = useInvoiceStore()

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        uploadInvoice(file)
      }
    },
    [uploadInvoice]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={clsx(
        'relative border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
        dragging
          ? 'border-amber-400 bg-amber-500/5'
          : 'border-border-bright hover:border-amber-500/50 hover:bg-surface-alt',
        isScanning && 'pointer-events-none opacity-50'
      )}
    >
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={onFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={isScanning}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={clsx(
          'w-12 h-12 rounded-lg flex items-center justify-center border',
          dragging
            ? 'bg-amber-500/15 border-amber-500/40'
            : 'bg-surface-alt border-border-bright'
        )}>
          {dragging ? (
            <FileText size={22} className="text-amber-400" />
          ) : (
            <Upload size={22} className="text-slate-500" />
          )}
        </div>
        <div>
          <p className="font-mono text-sm text-slate-300 font-medium">
            {dragging ? 'Drop to scan' : 'Drop invoice PDF or image'}
          </p>
          <p className="font-mono text-xs text-slate-600 mt-1">
            PDF · PNG · JPG · TIFF — up to 10MB
          </p>
        </div>
      </div>
    </div>
  )
}

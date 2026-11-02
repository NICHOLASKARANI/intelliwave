'use client'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const VARIANT_STYLES = {
  danger:  { bg: 'bg-red-500/10', text: 'text-red-400', button: 'bg-red-600 hover:bg-red-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', button: 'bg-amber-600 hover:bg-amber-500' },
  info:    { bg: 'bg-blue-500/10', text: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-500' },
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, onCancel, loading,
}: ConfirmDialogProps) {
  if (!open) return null
  const styles = VARIANT_STYLES[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center flex-shrink-0`}>
            <AlertCircle className={`w-5 h-5 ${styles.text}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
          <button onClick={onCancel} disabled={loading} className="text-slate-500 hover:text-white transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 ${styles.button} disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors`}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
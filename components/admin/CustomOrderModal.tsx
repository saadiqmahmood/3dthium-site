import { useEffect, useRef, useState } from 'react'
import { X, Download, Mail, Phone, MapPin, Ruler, FileText } from 'lucide-react'
import { authFetch } from '@/lib/api/authFetch'

export type CustomOrder = {
  id: number
  name: string
  email: string
  phone: string | null
  material: string
  address: string
  width: number | null
  height: number | null
  depth: number | null
  description: string
  file_url: string
  status: string
  admin_notes: string | null
  created_at: string
}

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

type Props = {
  order: CustomOrder
  onClose: () => void
  onUpdated: (id: number, status: string, admin_notes: string) => void
}

export default function CustomOrderModal({ order, onClose, onUpdated }: Props) {
  const [status, setStatus] = useState(order.status)
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await authFetch(`/api/admin/custom-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }
      onUpdated(order.id, status, adminNotes)
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose()
  }

  const isDirty = status !== order.status || adminNotes !== (order.admin_notes ?? '')

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-250 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
    >
      <div
        className={`relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transition-transform duration-250 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-xs text-zinc-400 font-light mb-0.5">Custom Order #{order.id}</p>
            <h2 className="text-lg font-light text-zinc-900">{order.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-light ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-zinc-700 border-gray-200'}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Customer */}
          <section>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-700 font-light">
                <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <a href={`mailto:${order.email}`} className="text-emerald-600 hover:text-emerald-700">{order.email}</a>
              </div>
              {order.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-700 font-light">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>{order.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm text-zinc-700 font-light">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>{order.address}</span>
              </div>
            </div>
          </section>

          {/* Order details */}
          <section>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Order Details</h3>
            <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-light">Material</span>
                <span className="text-zinc-900 font-light">{order.material}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-light flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Dimensions (mm)
                </span>
                <span className="text-zinc-900 font-light">
                  {order.width ?? '–'} × {order.height ?? '–'} × {order.depth ?? '–'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-light">Submitted</span>
                <span className="text-zinc-900 font-light">{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Description</h3>
            <p className="text-sm text-zinc-700 font-light leading-relaxed whitespace-pre-wrap bg-zinc-50 rounded-xl p-4">
              {order.description}
            </p>
          </section>

          {/* File */}
          <section>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">File</h3>
            <a
              href={order.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-light rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download STL / File
            </a>
          </section>

          {/* Fulfillment controls */}
          <section>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Fulfillment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 font-light mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 font-light mb-1.5">
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="e.g. Quoted £45, awaiting customer approval..."
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 resize-none"
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-600 font-light">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-zinc-600 font-light hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-light rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { authFetch } from '@/lib/api/authFetch'

type Settings = {
  accordion_materials_printing: string
  accordion_delivery_returns: string
}

const DEFAULTS: Settings = {
  accordion_materials_printing:
    'We print in PLA+ and PETG — both durable, environmentally conscious materials. PLA+ is ideal for decorative and display pieces; PETG is stronger and heat-resistant, suited to functional items. Colours are produced in-house and may vary slightly from on-screen representations.',
  accordion_delivery_returns:
    'Free UK standard delivery on orders over £30. Items are dispatched within 2–4 business days of ordering. We accept returns on non-personalised items within 14 days of receipt — please contact us to arrange.',
}

const FIELDS: { key: keyof Settings; label: string; hint: string }[] = [
  {
    key: 'accordion_materials_printing',
    label: 'Materials & printing',
    hint: 'Shown in the "Materials & printing" accordion on every product page.',
  },
  {
    key: 'accordion_delivery_returns',
    label: 'Delivery & returns',
    hint: 'Shown in the "Delivery & returns" accordion on every product page.',
  },
]

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [saved, setSaved] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    authFetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULTS, ...data }
        setSettings(merged)
        setSaved(merged)
      })
      .catch(() => setToast({ message: 'Failed to load settings', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(settings)
      setToast({ message: 'Settings saved', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Site Settings</h1>
        <p className="text-sm text-zinc-500 font-light">
          Content shown on every product page. Changes go live within 60 seconds.
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-medium text-zinc-700 uppercase tracking-wider">
              Product page accordion sections
            </h2>

            {FIELDS.map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-sm font-light text-zinc-700 mb-1">
                  {label}
                </label>
                <p className="text-xs text-zinc-400 font-light mb-2">{hint}</p>
                <textarea
                  value={settings[key]}
                  onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={4}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 resize-y"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSettings(saved)}
              disabled={!isDirty || saving}
              className="text-sm text-zinc-500 hover:text-zinc-700 font-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-light rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

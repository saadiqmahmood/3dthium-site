import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { authFetch } from '@/lib/api/authFetch'

type Message = {
  id: number
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  created_at: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    authFetch('/api/admin/contact-messages')
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setToast({ message: 'Failed to load messages', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (msg: Message, read: boolean) => {
    await authFetch('/api/admin/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msg.id, read }),
    })
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read } : m)))
    if (selected?.id === msg.id) setSelected({ ...msg, read })
  }

  const handleDelete = async (id: number) => {
    await authFetch(`/api/admin/contact-messages?id=${id}`, { method: 'DELETE' })
    setMessages((prev) => prev.filter((m) => m.id !== id))
    if (selected?.id === id) setSelected(null)
    setToast({ message: 'Message deleted', type: 'success' })
  }

  const handleSelect = (msg: Message) => {
    setSelected(msg)
    if (!msg.read) markRead(msg, true)
  }

  const unreadCount = messages.filter((m) => !m.read).length

  return (
    <div className="w-full">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light text-zinc-900 mb-2">Messages</h1>
          <p className="text-sm text-zinc-500 font-light">Customer contact and support requests</p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            {unreadCount} unread
          </span>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 font-light">No messages yet.</div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Message list */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
            {messages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleSelect(msg)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? 'bg-emerald-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-sm truncate ${msg.read ? 'font-light text-zinc-700' : 'font-medium text-zinc-900'}`}>
                    {msg.name}
                  </span>
                  {!msg.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-light truncate mb-1">
                  {msg.subject || '(no subject)'}
                </p>
                <p className="text-xs text-zinc-400 font-light">
                  {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </button>
            ))}
          </div>

          {/* Message detail */}
          <div className="flex-1 border border-gray-200 rounded-xl bg-white overflow-y-auto">
            {selected ? (
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-light text-zinc-900 mb-1">
                      {selected.subject || '(no subject)'}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 font-light">
                      <span>{selected.name}</span>
                      <span>·</span>
                      <a href={`mailto:${selected.email}`} className="text-emerald-600 hover:text-emerald-700">
                        {selected.email}
                      </a>
                      <span>·</span>
                      <span>{new Date(selected.created_at).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => markRead(selected, !selected.read)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 font-light border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      Mark {selected.read ? 'unread' : 'read'}
                    </button>
                    <a
                      href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject ?? '')}`}
                      className="text-xs text-white font-light bg-zinc-900 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reply
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(selected.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-light border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-xl p-5 text-sm text-zinc-700 font-light leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 font-light text-sm">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

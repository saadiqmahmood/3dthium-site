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
  replied_at: string | null
  reply_body: string | null
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)

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
    setReplyOpen(false)
    setReplyBody('')
    if (!msg.read) markRead(msg, true)
  }

  const handleSendReply = async () => {
    if (!selected || !replyBody.trim()) return
    setReplySending(true)
    try {
      const r = await authFetch('/api/admin/contact-messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, body: replyBody.trim() }),
      })
      if (r.ok) {
        const updated = { ...selected, replied_at: new Date().toISOString(), reply_body: replyBody.trim(), read: true }
        setMessages((prev) => prev.map((m) => (m.id === selected.id ? updated : m)))
        setSelected(updated)
        setReplyBody('')
        setReplyOpen(false)
        setToast({ message: 'Reply sent successfully', type: 'success' })
      } else {
        const data = await r.json()
        setToast({ message: data.error ?? 'Failed to send reply', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network error sending reply', type: 'error' })
    } finally {
      setReplySending(false)
    }
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {msg.replied_at && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" title="Replied" />
                    )}
                    {!msg.read && !msg.replied_at && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    )}
                  </div>
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
                    <button
                      type="button"
                      onClick={() => { setReplyOpen((v) => !v); setReplyBody('') }}
                      className={`text-xs font-light px-3 py-1.5 rounded-lg transition-colors ${replyOpen ? 'bg-zinc-100 text-zinc-700 border border-zinc-200' : 'bg-zinc-900 hover:bg-zinc-700 text-white'}`}
                    >
                      {replyOpen ? 'Cancel' : selected.replied_at ? 'Reply again' : 'Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selected.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-light border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {selected.replied_at && !replyOpen && (
                  <div className="mb-4 flex items-center gap-2 text-xs text-blue-600 font-light">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Replied {new Date(selected.replied_at).toLocaleString('en-GB')}
                  </div>
                )}

                <div className="bg-zinc-50 rounded-xl p-5 text-sm text-zinc-700 font-light leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>

                {replyOpen && (
                  <div className="mt-4 border border-emerald-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-800">
                        Replying to {selected.name} &lt;{selected.email}&gt;
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write your reply here…"
                      className="w-full px-4 py-3 text-sm font-light text-zinc-800 placeholder:text-zinc-400 focus:outline-none resize-none"
                    />
                    <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-light">Sent via support@3dthium.com</span>
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={replySending || !replyBody.trim()}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white text-xs font-light rounded-lg transition-colors"
                      >
                        {replySending ? 'Sending…' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {selected.reply_body && !replyOpen && (
                  <div className="mt-4 border border-blue-100 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                      <span className="text-xs font-medium text-blue-700">Your reply</span>
                    </div>
                    <div className="px-4 py-3 text-sm text-zinc-600 font-light whitespace-pre-wrap">
                      {selected.reply_body}
                    </div>
                  </div>
                )}
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

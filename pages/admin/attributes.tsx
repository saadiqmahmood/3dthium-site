import type React from 'react'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/ui/Toast'
import { authFetch } from '@/lib/api/authFetch'

type ColorGroup = { id: string; name: string; sort_order: number }
type ColorOption = { id: string; group_id: string | null; name: string; hex_color: string; sort_order: number }
type HeightOption = { id: string; label: string; sort_order: number }
type RoomOption = { id: string; name: string; sort_order: number }

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
      style={{ backgroundColor: hex }}
    />
  )
}

function InlineForm({
  fields,
  onSave,
  onCancel,
}: {
  fields: React.ReactNode
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-end gap-2 mt-2">
      {fields}
      <button
        type="button"
        onClick={onSave}
        className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 border border-gray-200 text-zinc-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

export default function AttributesPage() {
  const [tab, setTab] = useState<'colours' | 'heights' | 'rooms'>('colours')
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([])
  const [colors, setColors] = useState<ColorOption[]>([])
  const [heights, setHeights] = useState<HeightOption[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Colour group form state
  const [groupForm, setGroupForm] = useState<{ id?: string; name: string } | null>(null)

  // Colour form state
  const [colorForm, setColorForm] = useState<{
    id?: string
    name: string
    hex_color: string
    group_id: string | null
  } | null>(null)

  // Height form state
  const [heightForm, setHeightForm] = useState<{ id?: string; label: string } | null>(null)

  // Room form state
  const [roomForm, setRoomForm] = useState<{ id?: string; name: string } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  const load = async () => {
    const res = await authFetch('/api/admin/filter-options')
    if (!res.ok) return
    const data = await res.json()
    setColorGroups(data.colorGroups ?? [])
    setColors(data.colors ?? [])
    setHeights(data.heights ?? [])
    setRooms(data.rooms ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // --- Color Group actions ---
  const saveGroup = async () => {
    if (!groupForm) return
    const method = groupForm.id ? 'PUT' : 'POST'
    const url = groupForm.id
      ? `/api/admin/filter-options/color-groups?id=${groupForm.id}`
      : '/api/admin/filter-options/color-groups'
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupForm.name }),
    })
    if (!res.ok) { showToast('Failed to save group', 'error'); return }
    setGroupForm(null)
    await load()
    showToast(groupForm.id ? 'Group updated' : 'Group created')
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this colour group? Colours in it will become ungrouped.')) return
    await authFetch(`/api/admin/filter-options/color-groups?id=${id}`, { method: 'DELETE' })
    await load()
    showToast('Group deleted')
  }

  // --- Color actions ---
  const saveColor = async () => {
    if (!colorForm) return
    const method = colorForm.id ? 'PUT' : 'POST'
    const url = colorForm.id
      ? `/api/admin/filter-options/colors?id=${colorForm.id}`
      : '/api/admin/filter-options/colors'
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: colorForm.name,
        hex_color: colorForm.hex_color,
        group_id: colorForm.group_id,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      showToast(data.error?.message ?? 'Failed to save colour', 'error')
      return
    }
    setColorForm(null)
    await load()
    showToast(colorForm.id ? 'Colour updated' : 'Colour added')
  }

  const deleteColor = async (id: string) => {
    if (!confirm('Delete this colour?')) return
    await authFetch(`/api/admin/filter-options/colors?id=${id}`, { method: 'DELETE' })
    await load()
    showToast('Colour deleted')
  }

  // --- Height actions ---
  const saveHeight = async () => {
    if (!heightForm) return
    const method = heightForm.id ? 'PUT' : 'POST'
    const url = heightForm.id
      ? `/api/admin/filter-options/heights?id=${heightForm.id}`
      : '/api/admin/filter-options/heights'
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: heightForm.label }),
    })
    if (!res.ok) { showToast('Failed to save height', 'error'); return }
    setHeightForm(null)
    await load()
    showToast(heightForm.id ? 'Height updated' : 'Height added')
  }

  const deleteHeight = async (id: string) => {
    if (!confirm('Delete this height option?')) return
    await authFetch(`/api/admin/filter-options/heights?id=${id}`, { method: 'DELETE' })
    await load()
    showToast('Height deleted')
  }

  const saveRoom = async () => {
    if (!roomForm) return
    const method = roomForm.id ? 'PUT' : 'POST'
    const url = roomForm.id
      ? `/api/admin/filter-options/rooms?id=${roomForm.id}`
      : '/api/admin/filter-options/rooms'
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomForm.name }),
    })
    if (!res.ok) { showToast('Failed to save room', 'error'); return }
    setRoomForm(null)
    await load()
    showToast(roomForm.id ? 'Room updated' : 'Room added')
  }

  const deleteRoom = async (id: string) => {
    if (!confirm('Delete this room option?')) return
    await authFetch(`/api/admin/filter-options/rooms?id=${id}`, { method: 'DELETE' })
    await load()
    showToast('Room deleted')
  }

  const coloursByGroup = colors.reduce<Record<string, ColorOption[]>>((acc, c) => {
    const key = c.group_id ?? '__ungrouped__'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-light text-zinc-900">Filter Attributes</h1>
          <p className="text-sm text-zinc-500 mt-1 font-light">
            Manage global colours and heights used to filter products on the shop.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-100 mb-8">
          {(['colours', 'heights', 'rooms'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${
                tab === t
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : tab === 'colours' ? (
          <div className="space-y-8">
            {/* Groups + their colours */}
            {colorGroups.map((group) => {
              const groupColors = coloursByGroup[group.id] ?? []
              const isEditingGroup = groupForm?.id === group.id
              return (
                <div key={group.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    {isEditingGroup ? (
                      <InlineForm
                        fields={
                          <input
                            autoFocus
                            value={groupForm!.name}
                            onChange={(e) => setGroupForm({ ...groupForm!, name: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveGroup()}
                            placeholder="Group name"
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                          />
                        }
                        onSave={saveGroup}
                        onCancel={() => setGroupForm(null)}
                      />
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-zinc-900">{group.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setGroupForm({ id: group.id, name: group.name })}
                            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGroup(group.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    {groupColors.map((c) => {
                      const isEditingColor = colorForm?.id === c.id
                      if (isEditingColor) {
                        return (
                          <div key={c.id} className="rounded-lg bg-zinc-50 p-3">
                            <InlineForm
                              fields={
                                <>
                                  <input
                                    type="color"
                                    value={colorForm!.hex_color}
                                    onChange={(e) => setColorForm({ ...colorForm!, hex_color: e.target.value })}
                                    className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
                                  />
                                  <input
                                    autoFocus
                                    value={colorForm!.name}
                                    onChange={(e) => setColorForm({ ...colorForm!, name: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && saveColor()}
                                    placeholder="Colour name"
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                                  />
                                  <input
                                    value={colorForm!.hex_color}
                                    onChange={(e) => setColorForm({ ...colorForm!, hex_color: e.target.value })}
                                    placeholder="#000000"
                                    maxLength={7}
                                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-light font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                                  />
                                </>
                              }
                              onSave={saveColor}
                              onCancel={() => setColorForm(null)}
                            />
                          </div>
                        )
                      }
                      return (
                        <div key={c.id} className="flex items-center justify-between py-2 px-1">
                          <div className="flex items-center gap-3">
                            <ColorSwatch hex={c.hex_color} />
                            <span className="text-sm font-light text-zinc-700">{c.name}</span>
                            <span className="text-xs text-zinc-400 font-mono">{c.hex_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setColorForm({ id: c.id, name: c.name, hex_color: c.hex_color, group_id: c.group_id })}
                              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteColor(c.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add colour to this group */}
                  {colorForm && !colorForm.id && colorForm.group_id === group.id ? (
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                      <InlineForm
                        fields={
                          <>
                            <input
                              type="color"
                              value={colorForm.hex_color}
                              onChange={(e) => setColorForm({ ...colorForm, hex_color: e.target.value })}
                              className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
                            />
                            <input
                              autoFocus
                              value={colorForm.name}
                              onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && saveColor()}
                              placeholder="Colour name"
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                            />
                            <input
                              value={colorForm.hex_color}
                              onChange={(e) => setColorForm({ ...colorForm, hex_color: e.target.value })}
                              placeholder="#000000"
                              maxLength={7}
                              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-light font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                            />
                          </>
                        }
                        onSave={saveColor}
                        onCancel={() => setColorForm(null)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setColorForm({ name: '', hex_color: '#6b7280', group_id: group.id })
                      }
                      className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                    >
                      + Add colour
                    </button>
                  )}
                </div>
              )
            })}

            {/* Ungrouped colours */}
            {(coloursByGroup['__ungrouped__'] ?? []).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-zinc-900 mb-4">Ungrouped</h3>
                <div className="space-y-2">
                  {(coloursByGroup['__ungrouped__'] ?? []).map((c) => {
                    const isEditingColor = colorForm?.id === c.id
                    if (isEditingColor) {
                      return (
                        <div key={c.id} className="rounded-lg bg-zinc-50 p-3">
                          <InlineForm
                            fields={
                              <>
                                <input
                                  type="color"
                                  value={colorForm!.hex_color}
                                  onChange={(e) => setColorForm({ ...colorForm!, hex_color: e.target.value })}
                                  className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
                                />
                                <input
                                  autoFocus
                                  value={colorForm!.name}
                                  onChange={(e) => setColorForm({ ...colorForm!, name: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && saveColor()}
                                  placeholder="Colour name"
                                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                                />
                                <input
                                  value={colorForm!.hex_color}
                                  onChange={(e) => setColorForm({ ...colorForm!, hex_color: e.target.value })}
                                  placeholder="#000000"
                                  maxLength={7}
                                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-light font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                                />
                              </>
                            }
                            onSave={saveColor}
                            onCancel={() => setColorForm(null)}
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={c.id} className="flex items-center justify-between py-2 px-1">
                        <div className="flex items-center gap-3">
                          <ColorSwatch hex={c.hex_color} />
                          <span className="text-sm font-light text-zinc-700">{c.name}</span>
                          <span className="text-xs text-zinc-400 font-mono">{c.hex_color}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setColorForm({ id: c.id, name: c.name, hex_color: c.hex_color, group_id: c.group_id })}
                            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteColor(c.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add colour group */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
              {groupForm && !groupForm.id ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 mb-3">New colour group</p>
                  <InlineForm
                    fields={
                      <input
                        autoFocus
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && saveGroup()}
                        placeholder="Group name, e.g. Warm Tones"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                      />
                    }
                    onSave={saveGroup}
                    onCancel={() => setGroupForm(null)}
                  />
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGroupForm({ name: '' })}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    + Add colour group
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorForm({ name: '', hex_color: '#6b7280', group_id: null })}
                    className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    + Add ungrouped colour
                  </button>
                </div>
              )}
              {colorForm && !colorForm.id && colorForm.group_id === null && (
                <div className="mt-4">
                  <InlineForm
                    fields={
                      <>
                        <input
                          type="color"
                          value={colorForm.hex_color}
                          onChange={(e) => setColorForm({ ...colorForm, hex_color: e.target.value })}
                          className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
                        />
                        <input
                          autoFocus
                          value={colorForm.name}
                          onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && saveColor()}
                          placeholder="Colour name"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                        />
                        <input
                          value={colorForm.hex_color}
                          onChange={(e) => setColorForm({ ...colorForm, hex_color: e.target.value })}
                          placeholder="#000000"
                          maxLength={7}
                          className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-light font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                        />
                      </>
                    }
                    onSave={saveColor}
                    onCancel={() => setColorForm(null)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : tab === 'heights' ? (
          /* Heights tab */
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 space-y-2">
            {heights.length === 0 && !heightForm && (
              <p className="text-sm text-zinc-400 font-light py-2">No height options yet.</p>
            )}
            {heights.map((h) => {
              const isEditing = heightForm?.id === h.id
              if (isEditing) {
                return (
                  <div key={h.id} className="rounded-lg bg-zinc-50 p-3">
                    <InlineForm
                      fields={
                        <input
                          autoFocus
                          value={heightForm!.label}
                          onChange={(e) => setHeightForm({ ...heightForm!, label: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && saveHeight()}
                          placeholder="e.g. Small (0–30cm)"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                        />
                      }
                      onSave={saveHeight}
                      onCancel={() => setHeightForm(null)}
                    />
                  </div>
                )
              }
              return (
                <div key={h.id} className="flex items-center justify-between py-2 px-1">
                  <span className="text-sm font-light text-zinc-700">{h.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHeightForm({ id: h.id, label: h.label })}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHeight(h.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}

            {heightForm && !heightForm.id ? (
              <div className="pt-3 border-t border-zinc-100">
                <InlineForm
                  fields={
                    <input
                      autoFocus
                      value={heightForm.label}
                      onChange={(e) => setHeightForm({ ...heightForm, label: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveHeight()}
                      placeholder="e.g. Small (0–30cm)"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                    />
                  }
                  onSave={saveHeight}
                  onCancel={() => setHeightForm(null)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setHeightForm({ label: '' })}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors pt-2"
              >
                + Add height
              </button>
            )}
          </div>
        ) : (
          /* Rooms tab */
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 space-y-2">
            {rooms.length === 0 && !roomForm && (
              <p className="text-sm text-zinc-400 font-light py-2">No room options yet.</p>
            )}
            {rooms.map((r) => {
              const isEditing = roomForm?.id === r.id
              if (isEditing) {
                return (
                  <div key={r.id} className="rounded-lg bg-zinc-50 p-3">
                    <InlineForm
                      fields={
                        <input
                          autoFocus
                          value={roomForm!.name}
                          onChange={(e) => setRoomForm({ ...roomForm!, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && saveRoom()}
                          placeholder="e.g. Living Room"
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                        />
                      }
                      onSave={saveRoom}
                      onCancel={() => setRoomForm(null)}
                    />
                  </div>
                )
              }
              return (
                <div key={r.id} className="flex items-center justify-between py-2 px-1">
                  <span className="text-sm font-light text-zinc-700">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRoomForm({ id: r.id, name: r.name })}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoom(r.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}

            {roomForm && !roomForm.id ? (
              <div className="pt-3 border-t border-zinc-100">
                <InlineForm
                  fields={
                    <input
                      autoFocus
                      value={roomForm.name}
                      onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveRoom()}
                      placeholder="e.g. Living Room"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none"
                    />
                  }
                  onSave={saveRoom}
                  onCancel={() => setRoomForm(null)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRoomForm({ name: '' })}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors pt-2"
              >
                + Add room
              </button>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  )
}

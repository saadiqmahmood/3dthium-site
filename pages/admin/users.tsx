import { useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  created_at: string
  is_admin?: boolean
  auth_user_id?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.auth_user_id?.toLowerCase().includes(search.toLowerCase())
  )
  const USERS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  )

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        console.log('🔍 [AdminUsers] Fetching users from API...')
        const response = await fetch('/api/admin/users')

        if (!response.ok) {
          console.error('❌ [AdminUsers] Error fetching users:', response.status)
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        console.log('✅ [AdminUsers] Users fetched successfully:', data?.length || 0)
        setUsers(data || [])
      } catch (error) {
        console.error('❌ [AdminUsers] Error:', error)
        console.error('Failed to load users')
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const allUsersSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.includes(u.id))
  const toggleSelectAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUsers(selectedUsers.filter((id) => !filteredUsers.some((u) => u.id === id)))
    } else {
      setSelectedUsers([...new Set([...selectedUsers, ...filteredUsers.map((u) => u.id)])])
    }
  }
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(
      selectedUsers.includes(id) ? selectedUsers.filter((i) => i !== id) : [...selectedUsers, id]
    )
  }
  const handleBulkDeleteUsers = async () => {
    try {
      for (const id of selectedUsers) {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      }
      setUsers((users) => users.filter((u) => !selectedUsers.includes(u.id)))
      setSelectedUsers([])
    } catch (error) {
      console.error('❌ [AdminUsers] Bulk delete error:', error)
        console.error('Failed to delete users')
    }
  }
  const handleAction = async (user: User, type: 'toggle') => {
    try {
      if (type === 'toggle') {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_admin: !user.is_admin }),
        })

        if (response.ok) {
          setUsers((users) =>
            users.map((u) => (u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
          )
        } else {
          throw new Error('Failed to update user')
        }
      }
    } catch (error) {
      console.error('❌ [AdminUsers] Action error:', error)
        console.error('Failed to update user')
    }
  }

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Users</h1>
        <p className="text-sm text-zinc-600 font-light">Manage user accounts and permissions</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          placeholder="Search by email or Auth User ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 w-full sm:w-72 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <span className="text-sm text-zinc-600 font-light ml-auto">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {selectedUsers.length > 0 && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-emerald-900 font-light">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDeleteUsers}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors font-light"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allUsersSelected}
                  onChange={toggleSelectAllUsers}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Email</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Created</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Role</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Auth User ID</th>
              <th className="px-4 py-3 text-center font-light text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-zinc-600 mt-2 font-light">Loading users...</p>
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  <p className="font-light">No users found.</p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-light text-zinc-900">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600 font-light text-xs">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-light ${
                        user.is_admin
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-zinc-600'
                      }`}
                    >
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 font-mono break-all text-xs font-light">
                    {user.auth_user_id}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleAction(user, 'toggle')}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-zinc-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-light"
                    >
                      {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 font-light">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

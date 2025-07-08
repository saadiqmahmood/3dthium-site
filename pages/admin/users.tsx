import { useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseContext'

type User = {
  id: string;
  email: string;
  created_at: string;
  is_admin?: boolean;
  auth_user_id?: string;
}

export default function AdminUsersPage() {
  const { client: supabaseClient } = useSupabase()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.auth_user_id?.toLowerCase().includes(search.toLowerCase())
  )
  const USERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      const { data } = await supabaseClient
        .from('users')
        .select('id, email, created_at, is_admin, auth_user_id')
        .order('created_at', { ascending: false })
      setUsers(data || [])
      setUsersLoading(false)
    }
    fetchUsers()
  }, [supabaseClient])

  const allUsersSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))
  const toggleSelectAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUsers(selectedUsers.filter(id => !filteredUsers.some(u => u.id === id)))
    } else {
      setSelectedUsers([...new Set([...selectedUsers, ...filteredUsers.map(u => u.id)])])
    }
  }
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(selectedUsers.includes(id) ? selectedUsers.filter(i => i !== id) : [...selectedUsers, id])
  }
  const handleBulkDeleteUsers = async () => {
    for (const id of selectedUsers) {
      await supabaseClient.from('users').delete().eq('id', id)
    }
    setUsers(users => users.filter(u => !selectedUsers.includes(u.id)))
    setSelectedUsers([])
  }
  const handleAction = async (user: User, type: 'toggle') => {
    if (type === 'toggle') {
      await supabaseClient
        .from('users')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id)
      setUsers(users => users.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
    }
  }

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  return (
    <div className="w-full mx-auto bg-white p-16">
      <h2 className="text-2xl font-bold mb-6 text-stone-800">Users</h2>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Search by email or Auth User ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-72 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <input type="checkbox" checked={allUsersSelected} onChange={toggleSelectAllUsers} className="accent-blue-200 w-5 h-3 rounded" />
        <span className="text-sm text-stone-800">Select All</span>
        {selectedUsers.length > 0 && (
          <span
            onClick={handleBulkDeleteUsers}
            className="ml-4 text-red-700 font-semibold hover:underline cursor-pointer select-none text-sm"
          >
            Delete Selected
          </span>
        )}
        <span className="ml-auto text-sm text-gray-500">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-3"><input type="checkbox" checked={allUsersSelected} onChange={toggleSelectAllUsers} className="accent-blue-200 w-5 h-3 rounded" /></th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">is_admin</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Auth User ID</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading users...</td></tr>
            ) : paginatedUsers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found.</td></tr>
            ) : paginatedUsers.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-3"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelectUser(user.id)} className="accent-blue-200 w-5 h-3 rounded" /></td>
                <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(user.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{user.is_admin ? 'Yes' : 'No'}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono break-all">{user.auth_user_id}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction(user, 'toggle')}
                      className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >
                      {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Previous</button>
        <span className="text-sm text-stone-800">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
      </div>
    </div>
  )
} 
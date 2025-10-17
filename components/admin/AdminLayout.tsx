import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin' },
  { key: 'categories', label: 'Categories', href: '/admin/categories' },
  { key: 'create-product', label: 'Create Product', href: '/admin/create-product' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'orders', label: 'Orders', href: '/admin/orders' },
  { key: 'products', label: 'Products', href: '/admin/products' },
  { key: 'custom-orders', label: 'Custom Orders', href: '/admin/custom-orders' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const current =
    router.pathname === '/admin' ? 'dashboard' : router.pathname.split('/')[2] || 'dashboard'

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth')
        return
      }
      if (!isAdmin) {
        router.push('/')
        return
      }
    }
  }, [user, isAdmin, authLoading, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Admin Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white border-b border-stone-200 px-8 py-3 flex items-center justify-between z-50">
        <Link href="/" className="text-4xl font-bold text-blue-500">
          3Dthium
        </Link>
        <Link href="/account" className="text-stone-800 hover:underline font-medium">
          My Account
        </Link>
      </nav>
      <div>
        {/* Sidebar */}
        <aside className="fixed top-[56px] left-0 h-[calc(100vh-56px)] w-64 bg-white shadow-lg z-40 flex-shrink-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <span className="text-xl font-bold text-stone-800">Admin</span>
            </div>
            <nav className="flex-1 px-6 py-4 space-y-2">
              {SECTIONS.map((s) => (
                <Link key={s.key} href={s.href} legacyBehavior>
                  <a
                    className={`block w-full text-left px-4 py-2 rounded ${current === s.key ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {s.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 flex flex-col pl-64 pt-[56px]">{children}</main>
      </div>
    </div>
  )
}

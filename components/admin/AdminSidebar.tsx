import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

type NavItem = {
  title: string
  href?: string
  icon: React.ReactNode
  badge?: number
  children?: NavItem[]
}

type NavSection = {
  title: string
  items: NavItem[]
}

const DashboardIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
)

const PackageIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

const ShoppingCartIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
)

const MailIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const UsersIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const TagIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l7.172-7.172a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
)

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

const ListIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
)

const FileTextIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const PanelLeftIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="M9 15l6-6-6-6" />
  </svg>
)

interface NavItemComponentProps {
  item: NavItem
  isActive: boolean
  isChild?: boolean
  onToggle?: () => void
  isOpen?: boolean
}

function NavItemComponent({ item, isActive, isChild, onToggle, isOpen }: NavItemComponentProps) {
  const router = useRouter()
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-zinc-700 hover:bg-gray-50 hover:text-zinc-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={isActive ? 'text-emerald-600' : 'text-zinc-500'}>{item.icon}</span>
            <span>{item.title}</span>
          </div>
          {item.badge && item.badge > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full">
              {item.badge}
            </span>
          )}
          <ChevronRightIcon
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-4">
            {item.children?.map((child) => (
              <NavItemComponent
                key={child.href}
                item={child}
                isActive={router.asPath === child.href}
                isChild
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-zinc-700 hover:bg-gray-50 hover:text-zinc-900'
      } ${isChild ? 'ml-2' : ''}`}
    >
      <span className={isActive ? 'text-emerald-600' : 'text-zinc-500'}>{item.icon}</span>
      <span className="flex-1">{item.title}</span>
      {item.badge && item.badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

interface AdminSidebarProps {
  onCollapse?: () => void
}

export default function AdminSidebar({ onCollapse }: AdminSidebarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['products']))

  const navSections: NavSection[] = useMemo(
    () => [
      {
        title: 'Overview',
        items: [
          {
            title: 'Dashboard',
            href: '/admin',
            icon: <DashboardIcon />,
          },
        ],
      },
      {
        title: 'Products',
        items: [
          {
            title: 'Products',
            icon: <PackageIcon />,
            children: [
              {
                title: 'All Products',
                href: '/admin/products',
                icon: <ListIcon />,
              },
              {
                title: 'Create Product',
                href: '/admin/create-product',
                icon: <PlusIcon />,
              },
              {
                title: 'Categories',
                href: '/admin/categories',
                icon: <TagIcon />,
              },
            ],
          },
        ],
      },
      {
        title: 'Orders',
        items: [
          {
            title: 'Orders',
            icon: <ShoppingCartIcon />,
            children: [
              {
                title: 'All Orders',
                href: '/admin/orders',
                icon: <FileTextIcon />,
              },
              {
                title: 'Custom Orders',
                href: '/admin/custom-orders',
                icon: <FileTextIcon />,
              },
            ],
          },
        ],
      },
      {
        title: 'Support',
        items: [
          {
            title: 'Messages',
            href: '/admin/messages',
            icon: <MailIcon />,
          },
        ],
      },
      {
        title: 'Users',
        items: [
          {
            title: 'Users',
            href: '/admin/users',
            icon: <UsersIcon />,
          },
        ],
      },
      {
        title: 'Settings',
        items: [
          {
            title: 'Site Settings',
            href: '/admin/site-settings',
            icon: <SettingsIcon />,
          },
        ],
      },
    ],
    []
  )

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle)
      } else {
        next.add(sectionTitle)
      }
      return next
    })
  }

  const isItemActive = (item: NavItem): boolean => {
    if (item.href && router.asPath === item.href) return true
    if (item.children) {
      return item.children.some((child) => child.href === router.asPath)
    }
    return false
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: isItemActive depends on router which is stable
  useEffect(() => {
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && isItemActive(item)) {
          setOpenSections((prev) => new Set(prev).add(item.title))
        }
      })
    })
  }, [navSections])

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">3</span>
          </div>
          <div>
            <h1 className="text-xl font-light text-zinc-900">3Dthium</h1>
            <p className="text-xs text-zinc-500 font-light">Admin Panel</p>
          </div>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-gray-100 hover:text-zinc-900 transition-colors"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h2 className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isOpen = openSections.has(item.title)
                  const isActive = isItemActive(item)

                  // Auto-open sections if they contain active items
                  if (isActive && item.children && !isOpen) {
                    setTimeout(() => setOpenSections((prev) => new Set(prev).add(item.title)), 0)
                  }

                  return (
                    <NavItemComponent
                      key={item.title}
                      item={item}
                      isActive={isActive}
                      onToggle={item.children ? () => toggleSection(item.title) : undefined}
                      isOpen={isOpen}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {user?.email || 'Admin User'}
            </p>
            <p className="text-xs text-zinc-500 font-light">Administrator</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="m9 18 6-6-6-6" />
              <path d="M3 12h18" />
            </svg>
            <span>Back to Site</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

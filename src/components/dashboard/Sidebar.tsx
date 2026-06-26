'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '⬜' },
  { href: '/jobs',       label: 'Jobs',        icon: '🔧' },
  { href: '/customers',  label: 'Customers',   icon: '👤' },
  { href: '/vehicles',   label: 'Vehicles',    icon: '🚗' },
  { href: '/parts',      label: 'Parts',       icon: '📦' },
  { href: '/suppliers',  label: 'Suppliers',   icon: '🏭' },
  { href: '/invoices',   label: 'Invoices',    icon: '💰' },
  { href: '/reminders',  label: 'Reminders',   icon: '🔔' },
  { href: '/leads',      label: 'FB Leads',    icon: '📣' },
  { href: '/settings',   label: 'Settings',    icon: '⚙️' },
]

// Bottom nav shows only the most-used 5 items on mobile
const bottomNav = [
  { href: '/dashboard', label: 'Home',     icon: '⬜' },
  { href: '/jobs',      label: 'Jobs',     icon: '🔧' },
  { href: '/invoices',  label: 'Invoices', icon: '💰' },
  { href: '/customers', label: 'Clients',  icon: '👤' },
  { href: '/settings',  label: 'More',     icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-blue-950 flex-col h-full shrink-0">
        <div className="px-5 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">O</div>
            <span className="text-white font-bold text-lg">OrcaTradie</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-blue-800">
          <div className="text-blue-300 text-xs mb-1 truncate">{session?.user?.name}</div>
          <div className="text-blue-400 text-xs mb-3 truncate">{session?.user?.email}</div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-blue-300 hover:text-white text-xs"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-blue-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">O</div>
          <span className="text-white font-bold">OrcaTradie</span>
        </div>
        <div className="text-blue-300 text-xs truncate max-w-[160px]">{session?.user?.name}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {bottomNav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive(href) ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

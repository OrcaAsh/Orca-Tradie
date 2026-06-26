'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',   icon: '⬜' },
  { href: '/jobs',       label: 'Jobs Board',   icon: '🔧' },
  { href: '/customers',  label: 'Customers',    icon: '👤' },
  { href: '/vehicles',   label: 'Vehicles',     icon: '🚗' },
  { href: '/parts',      label: 'Parts',        icon: '📦' },
  { href: '/invoices',   label: 'Invoices',     icon: '💰' },
  { href: '/reminders',  label: 'Reminders',    icon: '🔔' },
  { href: '/leads',      label: 'FB Leads',     icon: '📣' },
  { href: '/settings',   label: 'Settings',     icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-56 bg-blue-950 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">O</div>
          <span className="text-white font-bold text-lg">OrcaTradie</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
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
  )
}

'use client'
import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  BOOKED:        'bg-blue-100 text-blue-800',
  IN_PROGRESS:   'bg-yellow-100 text-yellow-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  COMPLETED:     'bg-green-100 text-green-800',
  INVOICED:      'bg-purple-100 text-purple-800',
  PAID:          'bg-gray-100 text-gray-800',
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
  )

  const { stats, recentJobs, upcomingReminders } = data

  const statCards = [
    { label: 'Active Jobs',          value: stats.activeJobs,          color: 'text-blue-600',   bg: 'bg-blue-50'  },
    { label: 'Completed This Month', value: stats.completedThisMonth,  color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Revenue This Month',   value: `$${stats.monthRevenue.toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overdue Invoices',     value: stats.overdueInvoices,     color: stats.overdueInvoices > 0 ? 'text-red-600' : 'text-gray-500', bg: stats.overdueInvoices > 0 ? 'bg-red-50' : 'bg-gray-50' },
    { label: 'Pending FB Leads',     value: stats.pendingLeads,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Jobs',           value: stats.totalJobs,           color: 'text-gray-600',   bg: 'bg-gray-50'  },
  ]

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Dashboard</h1>

      {/* Stats grid — 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{job.title}</div>
                    <div className="text-xs text-gray-500">
                      {job.customer ? `${job.customer.firstName} ${job.customer.lastName ?? ''}` : 'No customer'}
                      {job.vehicle ? ` · ${job.vehicle.make} ${job.vehicle.model}` : ''}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Reminders</h2>
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming reminders</p>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((r: any) => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="text-xl shrink-0">{r.type === 'REGO_EXPIRY' ? '🚗' : r.type === 'SERVICE_DUE' ? '🔧' : '🔔'}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.message}</div>
                    <div className="text-xs text-gray-500">
                      {r.customer ? `${r.customer.firstName} ${r.customer.lastName ?? ''}` : ''}
                      {' · '}
                      {new Date(r.dueAt).toLocaleDateString('en-AU')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

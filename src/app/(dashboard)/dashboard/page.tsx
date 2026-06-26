'use client'
import { useEffect, useState } from 'react'

interface Stats {
  totalJobs: number
  activeJobs: number
  completedThisMonth: number
  overdueInvoices: number
  pendingLeads: number
  monthRevenue: number
}

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

  if (!data) return <div className="p-8 text-gray-400">Loading...</div>

  const { stats, recentJobs, upcomingReminders } = data as { stats: Stats; recentJobs: any[]; upcomingReminders: any[] }

  const statCards = [
    { label: 'Active Jobs',         value: stats.activeJobs,         color: 'bg-blue-600' },
    { label: 'Completed This Month',value: stats.completedThisMonth, color: 'bg-green-600' },
    { label: 'Revenue This Month',  value: `$${stats.monthRevenue.toLocaleString()}`, color: 'bg-emerald-600' },
    { label: 'Overdue Invoices',    value: stats.overdueInvoices,    color: stats.overdueInvoices > 0 ? 'bg-red-600' : 'bg-gray-500' },
    { label: 'Pending FB Leads',    value: stats.pendingLeads,       color: 'bg-indigo-600' },
    { label: 'Total Jobs',          value: stats.totalJobs,          color: 'bg-gray-600' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className={`inline-block w-2 h-2 rounded-full ${color} mb-2`} />
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    <div className="text-xs text-gray-500">
                      {job.customer ? `${job.customer.firstName} ${job.customer.lastName ?? ''}` : 'No customer'}
                      {job.vehicle ? ` · ${job.vehicle.make} ${job.vehicle.model}` : ''}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Reminders</h2>
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming reminders</p>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((r: any) => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="text-lg">{r.type === 'REGO_EXPIRY' ? '🚗' : r.type === 'SERVICE_DUE' ? '🔧' : '🔔'}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{r.message}</div>
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

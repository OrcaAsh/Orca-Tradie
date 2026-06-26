'use client'
import { useEffect, useState } from 'react'

const STATUSES = ['BOOKED', 'IN_PROGRESS', 'WAITING_PARTS', 'QUOTE_SENT', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED']
const STATUS_COLORS: Record<string, string> = {
  BOOKED:        'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  WAITING_PARTS: 'bg-orange-100 text-orange-800 border-orange-200',
  QUOTE_SENT:    'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED:     'bg-green-100 text-green-800 border-green-200',
  INVOICED:      'bg-indigo-100 text-indigo-800 border-indigo-200',
  PAID:          'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED:     'bg-red-100 text-red-800 border-red-200',
}

export default function JobsPage() {
  const [jobs, setJobs]           = useState<any[]>([])
  const [filter, setFilter]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles]   = useState<any[]>([])
  const [form, setForm]           = useState({
    title: '', description: '', customerId: '', vehicleId: '', scheduledAt: '', odometerIn: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(setJobs)
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles)
  }, [])

  const filtered = filter ? jobs.filter(j => j.status === filter) : jobs

  async function createJob(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const job = await res.json()
    setJobs(prev => [job, ...prev])
    setShowNew(false)
    setForm({ title: '', description: '', customerId: '', vehicleId: '', scheduledAt: '', odometerIn: '' })
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Board</h1>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Job
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          All
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s === filter ? '' : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === s ? STATUS_COLORS[s] : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-gray-400 text-sm">No jobs found.</p>}
        {filtered.map((job: any) => (
          <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{job.jobNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[job.status]}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="font-semibold text-gray-900">{job.title}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {job.customer ? `${job.customer.firstName} ${job.customer.lastName ?? ''}` : 'No customer'}
                  {job.vehicle ? ` · ${job.vehicle.year ?? ''} ${job.vehicle.make} ${job.vehicle.model} ${job.vehicle.rego ? `(${job.vehicle.rego})` : ''}` : ''}
                </div>
                {job.scheduledAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    📅 {new Date(job.scheduledAt).toLocaleDateString('en-AU')}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {job.totalValue && (
                  <div className="text-sm font-semibold text-green-700">${job.totalValue.toLocaleString()}</div>
                )}
                <select
                  value={job.status}
                  onChange={e => updateStatus(job.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            {job.aiUpsell && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                💡 AI Upsell: {job.aiUpsell}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Job Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Job</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={createJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Full service + brake pads"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    value={form.customerId}
                    onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select —</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName ?? ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select
                    value={form.vehicleId}
                    onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select —</option>
                    {vehicles
                      .filter((v: any) => !form.customerId || v.customerId === form.customerId)
                      .map((v: any) => (
                        <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} {v.rego ? `(${v.rego})` : ''}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer In</label>
                  <input
                    type="number" value={form.odometerIn}
                    onChange={e => setForm(f => ({ ...f, odometerIn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="km"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer complaint, work required..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

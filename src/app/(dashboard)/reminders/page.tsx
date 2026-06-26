'use client'
import { useEffect, useState } from 'react'

const TYPE_ICONS: Record<string, string> = {
  SERVICE_DUE:    '🔧',
  REGO_EXPIRY:    '🚗',
  QUOTE_FOLLOWUP: '📋',
  PAYMENT_CHASE:  '💵',
  CUSTOM:         '🔔',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  SENT:      'bg-blue-100 text-blue-800',
  DONE:      'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles]   = useState<any[]>([])
  const [showNew, setShowNew]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({
    type: 'CUSTOM', message: '', dueAt: '', customerId: '', vehicleId: '',
  })

  useEffect(() => {
    fetch('/api/reminders').then(r => r.json()).then(setReminders)
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles)
  }, [])

  async function createReminder(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const r = await res.json()
    setReminders(prev => [r, ...prev])
    setShowNew(false)
    setForm({ type: 'CUSTOM', message: '', dueAt: '', customerId: '', vehicleId: '' })
    setSaving(false)
  }

  const overdue = reminders.filter(r => r.status === 'PENDING' && new Date(r.dueAt) < new Date())
  const upcoming = reminders.filter(r => r.status === 'PENDING' && new Date(r.dueAt) >= new Date())
  const past = reminders.filter(r => r.status !== 'PENDING')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Reminder
        </button>
      </div>

      {overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-600 mb-2">⚠️ Overdue ({overdue.length})</h2>
          <div className="space-y-2">
            {overdue.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Past</h2>
          <div className="space-y-2">
            {past.map(r => <ReminderCard key={r.id} reminder={r} />)}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <p className="text-gray-400 text-sm">No reminders yet.</p>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Reminder</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={createReminder} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.keys(TYPE_ICONS).map(t => (
                    <option key={t} value={t}>{TYPE_ICONS[t]} {t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input required type="datetime-local" value={form.dueAt} onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">—</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName ?? ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">—</option>
                    {vehicles
                      .filter((v: any) => !form.customerId || v.customerId === form.customerId)
                      .map((v: any) => (
                        <option key={v.id} value={v.id}>{v.make} {v.model} {v.rego ? `(${v.rego})` : ''}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderCard({ reminder: r }: { reminder: any }) {
  const isOverdue = r.status === 'PENDING' && new Date(r.dueAt) < new Date()
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl">{TYPE_ICONS[r.type] ?? '🔔'}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-gray-900 text-sm">{r.message}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
              {r.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.customer ? `${r.customer.firstName} ${r.customer.lastName ?? ''}` : ''}
            {r.vehicle ? ` · ${r.vehicle.make} ${r.vehicle.model}` : ''}
            {' · '}
            {new Date(r.dueAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}

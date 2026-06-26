'use client'
import { useEffect, useState } from 'react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showNew, setShowNew]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', website: '', notes: '' })

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers)
  }, [])

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const s = await res.json()
    setSuppliers(prev => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)))
    setShowNew(false)
    setForm({ name: '', phone: '', email: '', website: '', notes: '' })
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your parts suppliers and their contact details</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🏭</div>
            <p className="text-sm">No suppliers yet. Add Repco, Burson, or your local parts shop.</p>
          </div>
        )}
        {suppliers.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 text-lg">{s.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s._count?.parts ?? 0} parts catalogued</div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">🏭</div>
            </div>
            <div className="space-y-1.5 text-sm">
              {s.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">📞</span> {s.phone}
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">✉️</span> {s.email}
                </div>
              )}
              {s.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">🌐</span>
                  <a href={s.website} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate">{s.website}</a>
                </div>
              )}
              {s.notes && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{s.notes}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Supplier</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={addSupplier} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Repco Phillip" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.repco.com.au" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Trade account #12345, 15% discount on brakes" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

export default function PartsPage() {
  const [parts, setParts]   = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    name: '', partNumber: '', description: '', costPrice: '', sellPrice: '',
    stockQty: '0', minStock: '1', location: '', category: '',
  })

  useEffect(() => {
    fetch('/api/parts').then(r => r.json()).then(setParts)
  }, [])

  const filtered = parts.filter(p => {
    const q = search.toLowerCase()
    return !q || `${p.name} ${p.partNumber} ${p.category}`.toLowerCase().includes(q)
  })

  const lowStock = parts.filter(p => p.stockQty <= p.minStock)

  async function addPart(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const p = await res.json()
    setParts(prev => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))
    setShowNew(false)
    setForm({ name: '', partNumber: '', description: '', costPrice: '', sellPrice: '', stockQty: '0', minStock: '1', location: '', category: '' })
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Part
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <div className="font-medium text-orange-800 text-sm mb-1">⚠️ Low Stock Alert</div>
          <div className="text-xs text-orange-700">
            {lowStock.map(p => p.name).join(', ')} — reorder soon
          </div>
        </div>
      )}

      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search parts..."
        className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Part</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Part #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Sell</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No parts yet</td></tr>
            )}
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.location && <div className="text-xs text-gray-400">📍 {p.location}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.partNumber || '—'}</td>
                <td className="px-4 py-3">
                  {p.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.category}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{p.costPrice ? `$${p.costPrice}` : '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{p.sellPrice ? `$${p.sellPrice}` : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${p.stockQty <= p.minStock ? 'text-orange-600' : 'text-gray-900'}`}>
                    {p.stockQty}
                  </span>
                  <span className="text-gray-400 text-xs"> / min {p.minStock}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Part</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={addPart} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                  <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price ($)</label>
                  <input type="number" step="0.01" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input type="number" value={form.stockQty} onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brakes" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (shelf/bin)</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="A3" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

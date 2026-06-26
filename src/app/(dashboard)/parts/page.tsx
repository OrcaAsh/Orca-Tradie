'use client'
import { useEffect, useState } from 'react'

function markupPct(cost: number, sell: number) {
  if (!cost || !sell) return null
  return Math.round(((sell - cost) / cost) * 100)
}

function applyMarkup(cost: number, pct: number) {
  return Math.round(cost * (1 + pct / 100) * 100) / 100
}

export default function PartsPage() {
  const [parts, setParts]           = useState<any[]>([])
  const [suppliers, setSuppliers]   = useState<any[]>([])
  const [defaultMarkup, setDefaultMarkup] = useState(30)
  const [search, setSearch]         = useState('')
  const [showNew, setShowNew]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [form, setForm] = useState({
    name: '', partNumber: '', description: '', costPrice: '', markup: '',
    sellPrice: '', stockQty: '0', minStock: '1', location: '', category: '', supplierId: '',
  })

  useEffect(() => {
    fetch('/api/parts').then(r => r.json()).then(setParts)
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers)
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.defaultMarkup) setDefaultMarkup(s.defaultMarkup)
    })
  }, [])

  // When cost or markup changes, auto-calculate sell price
  function handleCostChange(val: string) {
    const cost = parseFloat(val)
    const mu   = parseFloat(form.markup || String(defaultMarkup))
    const sell = !isNaN(cost) && !isNaN(mu) ? String(applyMarkup(cost, mu)) : ''
    setForm(f => ({ ...f, costPrice: val, sellPrice: sell }))
  }

  function handleMarkupChange(val: string) {
    const cost = parseFloat(form.costPrice)
    const mu   = parseFloat(val)
    const sell = !isNaN(cost) && !isNaN(mu) ? String(applyMarkup(cost, mu)) : ''
    setForm(f => ({ ...f, markup: val, sellPrice: sell }))
  }

  function handleSellChange(val: string) {
    const cost = parseFloat(form.costPrice)
    const sell = parseFloat(val)
    const mu   = !isNaN(cost) && !isNaN(sell) && cost > 0
      ? String(Math.round(((sell - cost) / cost) * 100))
      : form.markup
    setForm(f => ({ ...f, sellPrice: val, markup: mu }))
  }

  const filtered = parts.filter(p => {
    const q = search.toLowerCase()
    return !q || `${p.name} ${p.partNumber} ${p.category} ${p.supplier?.name}`.toLowerCase().includes(q)
  })

  const lowStock = parts.filter(p => p.stockQty <= p.minStock)

  async function addPart(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, markup: form.markup || String(defaultMarkup) }),
    })
    const p = await res.json()
    const supplier = suppliers.find(s => s.id === form.supplierId)
    setParts(prev => [...prev, { ...p, supplier }].sort((a, b) => a.name.localeCompare(b.name)))
    setShowNew(false)
    setForm({ name: '', partNumber: '', description: '', costPrice: '', markup: '',
      sellPrice: '', stockQty: '0', minStock: '1', location: '', category: '', supplierId: '' })
    setSaving(false)
  }

  const totalStockValue = parts.reduce((sum, p) => sum + (p.costPrice ?? 0) * p.stockQty, 0)
  const totalSellValue  = parts.reduce((sum, p) => sum + (p.sellPrice ?? 0) * p.stockQty, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Default markup: {defaultMarkup}% — change in Settings</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Part
        </button>
      </div>

      {/* Stock value summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Parts in stock</div>
          <div className="text-2xl font-bold text-gray-900">{parts.reduce((s, p) => s + p.stockQty, 0)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Cost value (what you paid)</div>
          <div className="text-2xl font-bold text-gray-900">${totalStockValue.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Sell value (what you charge)</div>
          <div className="text-2xl font-bold text-green-700">${totalSellValue.toFixed(0)}</div>
          {totalStockValue > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">
              ${(totalSellValue - totalStockValue).toFixed(0)} gross margin
            </div>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <div className="font-medium text-orange-800 text-sm mb-1">⚠️ Low Stock — reorder soon</div>
          <div className="text-xs text-orange-700">{lowStock.map(p => p.name).join(', ')}</div>
        </div>
      )}

      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search parts, part numbers, categories, suppliers..."
        className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Part</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Markup</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Sell Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No parts yet</td></tr>
            )}
            {filtered.map((p: any) => {
              const mu = p.costPrice && p.sellPrice ? markupPct(p.costPrice, p.sellPrice) : null
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="flex gap-2 mt-0.5">
                      {p.partNumber && <span className="text-xs font-mono text-gray-400">{p.partNumber}</span>}
                      {p.category && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p.category}</span>}
                      {p.location && <span className="text-xs text-gray-400">📍{p.location}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {p.costPrice ? `$${p.costPrice.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {mu !== null ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        mu >= 30 ? 'bg-green-100 text-green-700' :
                        mu >= 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {mu}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {p.sellPrice ? `$${p.sellPrice.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stockQty <= p.minStock ? 'text-orange-600' : 'text-gray-900'}`}>
                      {p.stockQty}
                    </span>
                    <span className="text-gray-400 text-xs"> / min {p.minStock}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
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

              {/* Pricing section with live markup calc */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">Pricing Calculator</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price ($)</label>
                    <input
                      type="number" step="0.01" value={form.costPrice}
                      onChange={e => handleCostChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="0.00"
                    />
                    <div className="text-xs text-gray-400 mt-1">What you pay</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Markup (%)</label>
                    <input
                      type="number" step="1" value={form.markup || String(defaultMarkup)}
                      onChange={e => handleMarkupChange(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    />
                    <div className="text-xs text-gray-400 mt-1">Your margin</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sell Price ($)</label>
                    <input
                      type="number" step="0.01" value={form.sellPrice}
                      onChange={e => handleSellChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="0.00"
                    />
                    <div className="text-xs text-gray-400 mt-1">What you charge</div>
                  </div>
                </div>
                {form.costPrice && form.sellPrice && (
                  <div className="mt-3 text-xs text-blue-700 font-medium">
                    Profit per unit: ${(parseFloat(form.sellPrice) - parseFloat(form.costPrice)).toFixed(2)}
                    {' '}· {markupPct(parseFloat(form.costPrice), parseFloat(form.sellPrice))}% markup
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— No supplier —</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brakes" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf / Bin Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. A3" />
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

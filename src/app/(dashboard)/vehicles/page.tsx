'use client'
import { useEffect, useState } from 'react'

export default function VehiclesPage() {
  const [vehicles, setVehicles]   = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({
    customerId: '', make: '', model: '', year: '', rego: '', regoExpiry: '',
    vin: '', colour: '', engineSize: '', transmission: '', odometer: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles)
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    return !q || `${v.make} ${v.model} ${v.rego} ${v.customer?.firstName}`.toLowerCase().includes(q)
  })

  const regoWarning = (expiry: string | null) => {
    if (!expiry) return null
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'text-red-600'
    if (days < 30) return 'text-orange-500'
    return null
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const v = await res.json()
    const customer = customers.find(c => c.id === form.customerId)
    setVehicles(prev => [{ ...v, customer }, ...prev])
    setShowNew(false)
    setForm({ customerId: '', make: '', model: '', year: '', rego: '', regoExpiry: '',
      vin: '', colour: '', engineSize: '', transmission: '', odometer: '', notes: '' })
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Vehicle
        </button>
      </div>

      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search make, model, rego, owner..."
        className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-3">No vehicles yet.</p>}
        {filtered.map((v: any) => {
          const regoColor = regoWarning(v.regoExpiry)
          return (
            <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</div>
                  <div className="text-sm text-gray-500">{v.customer?.firstName} {v.customer?.lastName ?? ''}</div>
                </div>
                <div className="text-2xl">🚗</div>
              </div>
              <div className="space-y-1 text-sm">
                {v.rego && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rego</span>
                    <span className="font-medium">{v.rego}</span>
                  </div>
                )}
                {v.regoExpiry && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rego Expiry</span>
                    <span className={`font-medium ${regoColor ?? 'text-gray-700'}`}>
                      {new Date(v.regoExpiry).toLocaleDateString('en-AU')}
                      {regoColor === 'text-red-600' && ' ⚠️ EXPIRED'}
                      {regoColor === 'text-orange-500' && ' ⚠️ Soon'}
                    </span>
                  </div>
                )}
                {v.odometer && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Odometer</span>
                    <span className="font-medium">{v.odometer.toLocaleString()} km</span>
                  </div>
                )}
                {v.colour && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Colour</span>
                    <span className="font-medium">{v.colour}</span>
                  </div>
                )}
                {v.transmission && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transmission</span>
                    <span className="font-medium">{v.transmission}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Jobs</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {v._count?.jobs ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Vehicle</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={addVehicle} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select required value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName ?? ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                  <input required value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Toyota" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input required value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="HiLux" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2020" min={1950} max={2030} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rego</label>
                  <input value={form.rego} onChange={e => setForm(f => ({ ...f, rego: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ABC123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rego Expiry</label>
                  <input type="date" value={form.regoExpiry} onChange={e => setForm(f => ({ ...f, regoExpiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                  <input value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                  <select value={form.transmission} onChange={e => setForm(f => ({ ...f, transmission: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">—</option>
                    <option>Auto</option>
                    <option>Manual</option>
                    <option>CVT</option>
                    <option>DCT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
                  <input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="km" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <input value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

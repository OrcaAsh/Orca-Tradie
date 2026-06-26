'use client'
import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-700',
  SENT:      'bg-blue-100 text-blue-700',
  PAID:      'bg-green-100 text-green-700',
  OVERDUE:   'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [jobs, setJobs]         = useState<any[]>([])
  const [showNew, setShowNew]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    jobId: '', clientName: '', clientEmail: '', subtotal: '', dueDate: '', notes: '',
  })

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(setInvoices)
    fetch('/api/jobs?status=COMPLETED').then(r => r.json()).then(setJobs)
  }, [])

  const uninvoiced = jobs.filter(j => !invoices.find(i => i.jobId === j.id))

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const inv = await res.json()
    setInvoices(prev => [inv, ...prev])
    setShowNew(false)
    setForm({ jobId: '', clientName: '', clientEmail: '', subtotal: '', dueDate: '', notes: '' })
    setSaving(false)
  }

  async function markPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'PAID', paidAt: new Date().toISOString() } : i))
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          {totalOutstanding > 0 && (
            <div className="text-sm text-orange-600 mt-0.5">
              ${totalOutstanding.toLocaleString()} outstanding
            </div>
          )}
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No invoices yet</td></tr>
            )}
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{inv.clientName}</div>
                  {inv.clientEmail && <div className="text-xs text-gray-400">{inv.clientEmail}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{inv.job?.title ?? '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">${inv.total.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-AU') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {inv.status === 'SENT' && (
                    <button onClick={() => markPaid(inv.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Invoice</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={createInvoice} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job *</label>
                <select required value={form.jobId}
                  onChange={e => {
                    const job = jobs.find(j => j.id === e.target.value)
                    setForm(f => ({
                      ...f, jobId: e.target.value,
                      clientName: job?.customer ? `${job.customer.firstName} ${job.customer.lastName ?? ''}`.trim() : '',
                      clientEmail: job?.customer?.email ?? '',
                      subtotal: job?.totalValue ? String(job.totalValue) : '',
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select completed job —</option>
                  {uninvoiced.map((j: any) => (
                    <option key={j.id} value={j.id}>{j.jobNumber} — {j.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal (ex GST) *</label>
                <input required type="number" step="0.01" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form.subtotal && (
                  <div className="text-xs text-gray-500 mt-1">
                    GST: ${(parseFloat(form.subtotal) * 0.1).toFixed(2)} · Total: ${(parseFloat(form.subtotal) * 1.1).toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

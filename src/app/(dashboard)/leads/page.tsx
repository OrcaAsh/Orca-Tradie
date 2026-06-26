'use client'
import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  POSTED:    'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-500',
}

export default function LeadsPage() {
  const [leads, setLeads]     = useState<any[]>([])
  const [filter, setFilter]   = useState('PENDING')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(setLeads)
  }, [])

  async function updateStatus(id: string, status: string) {
    setLoading(true)
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setLoading(false)
  }

  const filtered = filter === 'ALL' ? leads : leads.filter(l => l.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facebook Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-scanned leads from Facebook groups</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['PENDING', 'POSTED', 'DISMISSED', 'ALL'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {s} {s !== 'ALL' && <span className="ml-1 opacity-70">({leads.filter(l => l.status === s).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📣</div>
            <div className="text-sm">No leads found. Connect your Facebook groups in Settings to start scanning.</div>
          </div>
        )}
        {filtered.map((lead: any) => (
          <div key={lead.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {lead.matchScore}% match
                  </span>
                  {lead.priceEstimate && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      ~{lead.priceEstimate}
                    </span>
                  )}
                </div>
                {lead.authorName && (
                  <div className="text-sm font-medium text-gray-700 mb-1">👤 {lead.authorName}</div>
                )}
                <div className="text-sm text-gray-800 mb-3 line-clamp-3">{lead.postText}</div>
                {lead.matchReason && (
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">Why this matches:</span> {lead.matchReason}
                  </div>
                )}
                {lead.suggestedReply && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
                    <div className="text-xs font-medium text-blue-600 mb-1">Draft Reply</div>
                    {lead.suggestedReply}
                  </div>
                )}
              </div>
            </div>
            {lead.status === 'PENDING' && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateStatus(lead.id, 'POSTED')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  ✓ Approve & Post
                </button>
                <button
                  onClick={() => updateStatus(lead.id, 'DISMISSED')}
                  disabled={loading}
                  className="px-4 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-lg text-sm"
                >
                  Dismiss
                </button>
                {lead.postUrl && (
                  <a
                    href={lead.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-lg text-sm flex items-center"
                  >
                    View Post
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  HOT:    'bg-red-100 text-red-700',
  WARM:   'bg-orange-100 text-orange-700',
  COLD:   'bg-blue-100 text-blue-700',
  URGENT: 'bg-purple-100 text-purple-700',
}

const URGENCY_COLORS: Record<string, string> = {
  NORMAL: 'bg-gray-100 text-gray-600',
  HIGH:   'bg-yellow-100 text-yellow-700',
  URGENT: 'bg-red-100 text-red-700',
}

export default function MissedCallsPage() {
  const [leads, setLeads]       = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => {
    fetch('/api/missed-calls').then(r => r.json()).then(setLeads)
  }, [])

  const filtered = filter === 'ALL' ? leads : leads.filter(l => l.category === filter)

  const counts = {
    HOT:    leads.filter(l => l.category === 'HOT').length,
    WARM:   leads.filter(l => l.category === 'WARM').length,
    URGENT: leads.filter(l => l.category === 'URGENT').length,
    COLD:   leads.filter(l => l.category === 'COLD').length,
  }

  async function markConverted(id: string) {
    await fetch('/api/missed-calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, convertedToJob: true }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, convertedToJob: true } : l))
    if (selected?.id === id) setSelected((s: any) => ({ ...s, convertedToJob: true }))
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Missed Call Text-Back</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {leads.length} conversations — AI texts customers back when you miss a call
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.entries(counts).map(([cat, count]) => (
          <div key={cat} className={`rounded-xl p-3 text-center cursor-pointer border-2 ${
            filter === cat ? 'border-gray-400' : 'border-transparent'
          } ${CATEGORY_COLORS[cat]?.replace('text-', 'bg-').split(' ')[0]} bg-opacity-30`}
            onClick={() => setFilter(filter === cat ? 'ALL' : cat)}>
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs font-medium">{cat}</div>
          </div>
        ))}
      </div>

      {/* Setup banner if no leads yet */}
      {leads.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <div className="font-semibold text-blue-800 mb-1">⚡ Setup required</div>
          <p className="text-sm text-blue-700 mb-3">
            Point your Twilio phone number webhooks to these URLs, then missed calls will automatically text customers back.
          </p>
          <div className="space-y-2 text-xs font-mono bg-white rounded-lg p-3 border border-blue-100">
            <div><span className="text-gray-400">Voice Webhook:</span> <span className="text-blue-700">{typeof window !== 'undefined' ? window.location.origin : ''}/api/twilio/inbound</span></div>
            <div><span className="text-gray-400">SMS Webhook:</span> <span className="text-blue-700">{typeof window !== 'undefined' ? window.location.origin : ''}/api/twilio/sms</span></div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['ALL', 'HOT', 'WARM', 'URGENT', 'COLD'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border shrink-0 ${
              filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Lead list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📞</div>
              <p className="text-sm">No missed calls yet.</p>
            </div>
          )}
          {filtered.map(lead => (
            <div key={lead.id}
              onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
              className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-colors ${
                selected?.id === lead.id ? 'border-blue-400' : 'border-gray-100 hover:border-gray-300'
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {lead.callerName ?? lead.phoneNumber}
                    </span>
                    {lead.callerName && (
                      <span className="text-xs text-gray-400">{lead.phoneNumber}</span>
                    )}
                  </div>
                  {lead.serviceRequested && (
                    <p className="text-sm text-gray-600 truncate">{lead.serviceRequested}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[lead.category]}`}>
                      {lead.category}
                    </span>
                    {lead.urgency !== 'NORMAL' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLORS[lead.urgency]}`}>
                        {lead.urgency}
                      </span>
                    )}
                    {lead.convertedToJob && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        ✓ Job created
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {lead.messages.length} msg{lead.messages.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversation panel */}
        {selected && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {selected.callerName ?? selected.phoneNumber}
                  </div>
                  {selected.callerName && (
                    <div className="text-xs text-gray-400">{selected.phoneNumber}</div>
                  )}
                  {selected.serviceRequested && (
                    <div className="text-sm text-gray-600 mt-1">🔧 {selected.serviceRequested}</div>
                  )}
                  {selected.callSummary && (
                    <div className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-2 mt-2">
                      <span className="font-medium text-blue-700">📞 Call summary: </span>
                      <span className="text-blue-600">{selected.callSummary}</span>
                    </div>
                  )}
                  {selected.notes && !selected.callSummary && (
                    <div className="text-sm text-gray-500 mt-1 italic">{selected.notes}</div>
                  )}
                </div>
                {!selected.convertedToJob && (
                  <button
                    onClick={() => markConverted(selected.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium">
                    + Create Job
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'USER'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {msg.content}
                    <div className={`text-xs mt-1 ${msg.role === 'USER' ? 'text-gray-400' : 'text-blue-200'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {selected.messages.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

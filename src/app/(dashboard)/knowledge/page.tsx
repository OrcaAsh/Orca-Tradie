'use client'
import { useEffect, useState } from 'react'

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

function tagColor(tag: string) {
  let hash = 0
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) % TAG_COLORS.length
  return TAG_COLORS[hash]
}

export default function KnowledgePage() {
  const [entries, setEntries]         = useState<any[]>([])
  const [search, setSearch]           = useState('')
  const [showNew, setShowNew]         = useState(false)
  const [editing, setEditing]         = useState<any>(null)
  const [saving, setSaving]           = useState(false)
  const [aiLoading, setAiLoading]     = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', content: '', tags: '' })

  useEffect(() => {
    fetch('/api/knowledge').then(r => r.json()).then(setEntries)
  }, [])

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || `${e.title} ${e.content} ${e.tags.join(' ')}`.toLowerCase().includes(q)
  })

  function openNew() {
    setForm({ title: '', content: '', tags: '' })
    setEditing(null)
    setShowNew(true)
  }

  function openEdit(entry: any) {
    setForm({ title: entry.title, content: entry.content, tags: entry.tags.join(', ') })
    setEditing(entry)
    setShowNew(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = { title: form.title, content: form.content, tags }

    if (editing) {
      await fetch(`/api/knowledge/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...payload } : e))
    } else {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const entry = await res.json()
      setEntries(prev => [entry, ...prev])
    }
    setShowNew(false)
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function addSuggestion(s: any) {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setSuggestions(prev => prev.filter(x => x.title !== s.title))
  }

  async function generateSuggestions() {
    setAiLoading(true)
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiGenerate: true }),
    })
    const data = await res.json()
    setSuggestions(data.suggestions ?? [])
    setAiLoading(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-0.5">{entries.length} entries — used by AI for quotes and replies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateSuggestions}
            disabled={aiLoading}
            className="border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {aiLoading ? '✨ Thinking...' : '✨ AI Suggest'}
          </button>
          <button onClick={openNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-blue-700 mb-3">✨ AI suggestions based on your jobs</div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{s.content}</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {s.tags?.map((t: string) => (
                        <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${tagColor(t)}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => addSuggestion(s)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium">
                      + Add
                    </button>
                    <button onClick={() => setSuggestions(prev => prev.filter((_, j) => j !== i))}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search knowledge base..."
        className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🧠</div>
            <p className="text-sm">No entries yet. Add pricing guides, vehicle quirks, or common upsells.</p>
            <p className="text-xs mt-1">The AI uses this when building quotes and suggesting replies.</p>
          </div>
        )}
        {filtered.map((entry: any) => (
          <div key={entry.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{entry.title}</div>
                <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{entry.content}</div>
                {entry.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {entry.tags.map((t: string) => (
                      <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${tagColor(t)}`}>{t}</span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Updated {new Date(entry.updatedAt).toLocaleDateString('en-AU')}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(entry)}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded-lg">
                  Edit
                </button>
                <button onClick={() => deleteEntry(entry.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 border border-red-200 rounded-lg">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit Entry' : 'Add Entry'}</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Toyota HiLux DPF issues" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the issue, pricing, tips, or upsell opportunity in detail..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="toyota, pricing, upsell" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

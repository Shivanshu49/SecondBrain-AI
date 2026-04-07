import { useState, useCallback } from 'react'
import { universalCapture, getEntries, updateEntry, deleteEntry } from '../api/secondbrain.js'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/capture.css'

function formatDue(isoOrText) {
  if (!isoOrText) return ''
  const d = new Date(isoOrText)
  if (Number.isNaN(d.getTime())) return isoOrText
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const typeIcons = { task: '✅', idea: '💡', note: '📝', goal: '🎯' }
const typeColors = { task: 'capture-type--task', idea: 'capture-type--idea', note: 'capture-type--note', goal: 'capture-type--goal' }

export default function Capture() {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.type = filter
      const list = await getEntries(params)
      setEntries(list || [])
    } catch (e) {
      setError(e.message || 'Failed to load entries')
    } finally {
      setEntriesLoading(false)
    }
  }, [filter])

  const handleCapture = useCallback(async () => {
    if (!inputText.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await universalCapture(inputText.trim())
      setResult(res)
      if (res.success) {
        setInputText('')
        await loadEntries()
      }
    } catch (e) {
      setError(e.message || 'Capture failed')
    } finally {
      setLoading(false)
    }
  }, [inputText, loadEntries])

  const handleToggle = useCallback(async (entry) => {
    if (entry.type !== 'task') return
    const nextStatus = entry.completed ? 'pending' : 'completed'
    try {
      await updateEntry(entry.id, { status: nextStatus })
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, completed: !e.completed, status: nextStatus } : e
        )
      )
    } catch (e) {
      setError(e.message || 'Could not update entry')
    }
  }, [])

  const handleDelete = useCallback(async (entryId) => {
    try {
      await deleteEntry(entryId)
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    } catch (e) {
      setError(e.message || 'Could not delete entry')
    }
  }, [])

  return (
    <main className="capture-page">
      <div className="capture-header">
        <h1 className="capture-title">🧠 BRAIN CAPTURE</h1>
        <p className="capture-subtitle">Type anything — AI classifies it as task, idea, note, or goal</p>
      </div>

      {error && (
        <div className="capture-error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="capture-input-section">
        <div className="capture-input-wrapper">
          <span className="capture-input-icon">✨</span>
          <textarea
            className="capture-textarea"
            placeholder="Capture anything…&#10;• 'Exam in 3 days' → creates a task&#10;• 'What if I build an AI app?' → saves as idea&#10;• 'Python is great for ML' → saves as note&#10;• 'Learn programming this year' → saves as goal"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleCapture()
              }
            }}
            disabled={loading}
            rows={3}
          />
        </div>
        <button
          className="capture-btn"
          onClick={handleCapture}
          disabled={loading || !inputText.trim()}
        >
          {loading ? '⏳ AI is thinking…' : '🧠 CAPTURE'}
        </button>
      </div>

      {result && result.success && (
        <div className="capture-result">
          <div className={`capture-result-badge ${typeColors[result.entry_type] || 'capture-type--note'}`}>
            {typeIcons[result.entry_type] || '📝'} {result.entry_type?.toUpperCase()}
          </div>
          <div className="capture-result-body">
            <strong>{result.entry?.title || result.original_text}</strong>
            {result.entry?.deadline && (
              <span className="capture-result-meta"> · Due {formatDue(result.entry.deadline)}</span>
            )}
            {result.entry?.priority && (
              <span className="capture-result-meta"> · {result.entry.priority.toUpperCase()} priority</span>
            )}
          </div>
          <span className="capture-confidence">Confidence: {result.confidence?.toUpperCase()}</span>
        </div>
      )}

      {result && !result.success && (
        <div className="capture-result capture-result--error">
          ⚠️ {result.error || 'Could not capture. Try rephrasing.'}
        </div>
      )}

      <div className="capture-entries-section">
        <div className="capture-entries-header">
          <h2>📚 YOUR BRAIN</h2>
          <div className="capture-filters">
            {['all', 'task', 'idea', 'note', 'goal'].map((f) => (
              <button
                key={f}
                className={`capture-filter-btn ${filter === f ? 'capture-filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {typeIcons[f] || '📋'} {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {entriesLoading && <div className="capture-loading">Loading entries…</div>}

        <div className="capture-entries-list">
          {!entriesLoading && entries.length === 0 && (
            <div className="capture-empty">
              <span className="capture-empty-icon">🧠</span>
              <p>Your brain is empty. Start capturing above!</p>
            </div>
          )}
          {entries.map((entry) => (
            <div
              className={`capture-entry ${entry.completed ? 'capture-entry--done' : ''}`}
              key={entry.id}
            >
              <button
                className={`capture-entry-check ${entry.completed ? 'capture-entry-check--done' : ''}`}
                onClick={() => handleToggle(entry)}
                aria-label={entry.completed ? 'Mark pending' : 'Mark complete'}
              >
                {entry.completed ? '✓' : ''}
              </button>
              <div className="capture-entry-body">
                <div className="capture-entry-top">
                  <span className={`capture-entry-type ${typeColors[entry.type] || ''}`}>
                    {typeIcons[entry.type] || '📝'} {entry.type}
                  </span>
                  <span className="capture-entry-title">{entry.title || entry.content?.slice(0, 60)}</span>
                </div>
                <div className="capture-entry-meta">
                  {entry.deadline && (
                    <span className="capture-entry-due">
                      {entry.completed ? '✅ Done' : `Due ${formatDue(entry.deadline)}`}
                    </span>
                  )}
                  {entry.priority && (
                    <span className={`capture-entry-priority capture-entry-priority--${entry.priority}`}>
                      {entry.priority.toUpperCase()}
                    </span>
                  )}
                  <span className="capture-entry-source">via {entry.source}</span>
                </div>
              </div>
              <button
                className="capture-entry-delete"
                onClick={() => handleDelete(entry.id)}
                aria-label="Delete entry"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>

      <FloatingElements items={['CAPTURE', 'CLASSIFY', 'ORGANIZE', '→', '◆', '▲']} />
    </main>
  )
}

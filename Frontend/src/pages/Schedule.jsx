import { useState, useCallback } from 'react'
import { getSchedule } from '../api/secondbrain.js'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/schedule.css'

export default function Schedule() {
  const [hours, setHours] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [aiNotes, setAiNotes] = useState('')
  const [generated, setGenerated] = useState(false)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSchedule(hours)
      setSchedule(res?.schedule || [])
      setAiNotes(res?.ai_notes || '')
      setGenerated(true)
    } catch (e) {
      setError(e.message || 'Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }, [hours])

  return (
    <main className="schedule-page">
      <div className="schedule-header">
        <h1 className="schedule-title">⏱️ AI SCHEDULER</h1>
        <p className="schedule-subtitle">
          Generate a time-blocked daily plan powered by AI. Adjust your available hours and hit generate.
        </p>
      </div>

      {error && (
        <div className="schedule-error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="schedule-controls">
        <div className="schedule-hours">
          <label className="schedule-hours-label">
            Available Hours: <strong>{hours}h</strong>
          </label>
          <input
            type="range"
            min={1}
            max={16}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="schedule-slider"
          />
          <div className="schedule-range-labels">
            <span>1h</span>
            <span>8h</span>
            <span>16h</span>
          </div>
        </div>
        <button
          className="schedule-gen-btn"
          onClick={generate}
          disabled={loading}
        >
          {loading ? '⏳ Generating…' : '▶ GENERATE SCHEDULE'}
        </button>
      </div>

      {generated && (
        <div className="schedule-content">
          {schedule.length === 0 && !aiNotes && (
            <div className="schedule-empty">
              <span className="schedule-empty-icon">📭</span>
              <p>No schedule generated. Add pending tasks first, then try again.</p>
            </div>
          )}

          {schedule.length > 0 && (
            <div className="schedule-timeline">
              <div className="schedule-timeline-header">
                <span>TIME</span>
                <span>TASK</span>
                <span>PRIORITY</span>
              </div>
              {schedule.map((slot, i) => (
                <div
                  className={`schedule-slot ${i === 0 ? 'schedule-slot--active' : ''}`}
                  key={`${slot.time}-${i}`}
                >
                  <span className="schedule-slot-time">{slot.time}</span>
                  <span className="schedule-slot-task">{slot.task}</span>
                  <span className={`schedule-slot-priority schedule-slot-priority--${(slot.priority || 'medium').toLowerCase()}`}>
                    {(slot.priority || '').toUpperCase()}
                  </span>
                  {i === 0 && <span className="schedule-now-badge">NOW</span>}
                </div>
              ))}
            </div>
          )}

          {aiNotes && (
            <div className="schedule-notes">
              <div className="schedule-notes-title">🧠 AI Notes</div>
              <p className="schedule-notes-text">{aiNotes}</p>
            </div>
          )}
        </div>
      )}

      {!generated && !loading && (
        <div className="schedule-placeholder">
          <div className="schedule-placeholder-icon">📅</div>
          <h2>Your personalized schedule awaits</h2>
          <p>Set your available hours and click "Generate Schedule" to get an AI-powered plan for your day.</p>
        </div>
      )}

      <FloatingElements items={['PLANNED', 'OPTIMIZED', 'ON TIME', '→', '◆', '▲']} />
    </main>
  )
}

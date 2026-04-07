import { useState, useCallback } from 'react'
import {
  getPrediction,
  prioritizeTasks,
  getMentalState,
  getSuggestions,
  brainDump,
  getReflection,
} from '../api/secondbrain.js'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/ai.css'

function ConfidenceBadge({ level }) {
  const cls =
    level === 'high'
      ? 'ai-badge--high'
      : level === 'low'
        ? 'ai-badge--low'
        : 'ai-badge--med'
  return <span className={`ai-badge ${cls}`}>{(level || 'unknown').toUpperCase()}</span>
}

export default function AIAssistant() {
  // Prediction
  const [predLoading, setPredLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  // Prioritize
  const [prioLoading, setPrioLoading] = useState(false)
  const [prioData, setPrioData] = useState(null)
  // Suggestions
  const [sugLoading, setSugLoading] = useState(false)
  const [sugData, setSugData] = useState(null)
  // Mental
  const [mentalLoading, setMentalLoading] = useState(false)
  const [mentalResult, setMentalResult] = useState(null)
  const [mentalInput, setMentalInput] = useState('')
  // Brain Dump
  const [dumpLoading, setDumpLoading] = useState(false)
  const [dumpResult, setDumpResult] = useState(null)
  const [dumpInput, setDumpInput] = useState('')
  // Reflection
  const [reflectionLoading, setReflectionLoading] = useState(false)
  const [reflectionResult, setReflectionResult] = useState(null)
  // Error
  const [error, setError] = useState(null)

  const runPrediction = useCallback(async () => {
    setPredLoading(true)
    setError(null)
    try {
      const res = await getPrediction()
      setPrediction(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setPredLoading(false)
    }
  }, [])

  const runPrioritize = useCallback(async () => {
    setPrioLoading(true)
    setError(null)
    try {
      const res = await prioritizeTasks()
      setPrioData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setPrioLoading(false)
    }
  }, [])

  const runSuggestions = useCallback(async () => {
    setSugLoading(true)
    setError(null)
    try {
      const res = await getSuggestions()
      setSugData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setSugLoading(false)
    }
  }, [])

  const runMental = useCallback(async () => {
    if (!mentalInput.trim()) return
    setMentalLoading(true)
    setError(null)
    try {
      const res = await getMentalState(mentalInput.trim())
      setMentalResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setMentalLoading(false)
    }
  }, [mentalInput])

  const runBrainDump = useCallback(async () => {
    if (!dumpInput.trim()) return
    setDumpLoading(true)
    setDumpResult(null)
    setError(null)
    try {
      const res = await brainDump(dumpInput.trim())
      setDumpResult(res)
      if (res.success) setDumpInput('')
    } catch (e) {
      setError(e.message)
    } finally {
      setDumpLoading(false)
    }
  }, [dumpInput])

  const runReflection = useCallback(async () => {
    setReflectionLoading(true)
    setReflectionResult(null)
    setError(null)
    try {
      const res = await getReflection()
      setReflectionResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setReflectionLoading(false)
    }
  }, [])

  return (
    <main className="ai-page">
      <div className="ai-header">
        <h1 className="ai-title">🧠 AI ASSISTANT</h1>
        <p className="ai-subtitle">
          Powered by Gemini — Predict, Prioritize, Organize, and Understand.
        </p>
      </div>

      {error && (
        <div className="ai-error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="ai-grid">
        {/* ── BRAIN DUMP ── */}
        <div className="ai-card ai-card--wide ai-card--dump" id="card-braindump">
          <div className="ai-card-header">
            <span className="ai-card-icon">🧹</span>
            <h2 className="ai-card-title">BRAIN DUMP</h2>
          </div>
          <p className="ai-card-desc">
            Dump everything on your mind — AI organizes it into Urgent, Later, and Ignore.
          </p>
          <div className="ai-dump-input-row">
            <textarea
              className="ai-dump-input"
              placeholder="Dump your thoughts here… e.g. 'I need to finish the project, worried about the exam, should clean my room, the dog needs food, maybe learn a new language someday…'"
              value={dumpInput}
              onChange={(e) => setDumpInput(e.target.value)}
              rows={4}
            />
            <button
              className="ai-action-btn ai-dump-btn"
              onClick={runBrainDump}
              disabled={dumpLoading || !dumpInput.trim()}
            >
              {dumpLoading ? '⏳ Organizing…' : '🧹 ORGANIZE'}
            </button>
          </div>
          {dumpResult && dumpResult.success && (
            <div className="dump-result">
              {dumpResult.summary && (
                <div className="dump-summary">{dumpResult.summary}</div>
              )}
              <div className="dump-columns">
                <div className="dump-column dump-column--urgent">
                  <div className="dump-column-header">🔴 URGENT</div>
                  {dumpResult.urgent?.length === 0 && (
                    <div className="dump-empty">Nothing urgent!</div>
                  )}
                  {dumpResult.urgent?.map((item, i) => (
                    <div className="dump-item" key={`u-${i}`}>
                      <div className="dump-item-text">{item.item}</div>
                      {item.reason && <div className="dump-item-reason">{item.reason}</div>}
                    </div>
                  ))}
                </div>
                <div className="dump-column dump-column--later">
                  <div className="dump-column-header">🟡 LATER</div>
                  {dumpResult.later?.length === 0 && (
                    <div className="dump-empty">Nothing for later!</div>
                  )}
                  {dumpResult.later?.map((item, i) => (
                    <div className="dump-item" key={`l-${i}`}>
                      <div className="dump-item-text">{item.item}</div>
                      {item.reason && <div className="dump-item-reason">{item.reason}</div>}
                    </div>
                  ))}
                </div>
                <div className="dump-column dump-column--ignore">
                  <div className="dump-column-header">⚪ IGNORE</div>
                  {dumpResult.ignore?.length === 0 && (
                    <div className="dump-empty">Nothing to ignore!</div>
                  )}
                  {dumpResult.ignore?.map((item, i) => (
                    <div className="dump-item" key={`ig-${i}`}>
                      <div className="dump-item-text">{item.item}</div>
                      {item.reason && <div className="dump-item-reason">{item.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {dumpResult && !dumpResult.success && (
            <div className="ai-result ai-result--error">
              ⚠️ {dumpResult.error || 'Could not organize thoughts. Try again.'}
            </div>
          )}
        </div>

        {/* ── PREDICTION ── */}
        <div className="ai-card" id="card-predict">
          <div className="ai-card-header">
            <span className="ai-card-icon">🔮</span>
            <h2 className="ai-card-title">PREDICTION ENGINE</h2>
          </div>
          <p className="ai-card-desc">
            Analyzes your tasks, completion rate, and streak to predict your success trajectory.
          </p>
          <button
            className="ai-action-btn"
            onClick={runPrediction}
            disabled={predLoading}
          >
            {predLoading ? '⏳ Analyzing…' : '▶ RUN PREDICTION'}
          </button>
          {prediction && (
            <div className="ai-result">
              <div className="ai-result-row">
                <span className="ai-result-label">Prediction:</span>
                <span className={`ai-pred ai-pred--${prediction.prediction}`}>
                  {(prediction.prediction || '').toUpperCase()}
                </span>
              </div>
              <div className="ai-result-row">
                <span className="ai-result-label">Confidence:</span>
                <ConfidenceBadge level={prediction.confidence} />
              </div>
              <div className="ai-result-summary">{prediction.summary}</div>
              {prediction.suggestions?.length > 0 && (
                <div className="ai-suggestions">
                  <div className="ai-suggestions-title">💡 Suggestions</div>
                  <ul>
                    {prediction.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PRIORITIZE ── */}
        <div className="ai-card" id="card-prioritize">
          <div className="ai-card-header">
            <span className="ai-card-icon">📊</span>
            <h2 className="ai-card-title">PRIORITIZE TASKS</h2>
          </div>
          <p className="ai-card-desc">
            AI ranks your pending tasks by urgency, importance, and deadline proximity.
          </p>
          <button
            className="ai-action-btn"
            onClick={runPrioritize}
            disabled={prioLoading}
          >
            {prioLoading ? '⏳ Prioritizing…' : '▶ PRIORITIZE NOW'}
          </button>
          {prioData && (
            <div className="ai-result">
              <div className="ai-result-summary ai-result-summary--pre">
                {prioData.data || prioData.message || JSON.stringify(prioData)}
              </div>
            </div>
          )}
        </div>

        {/* ── SUGGESTIONS ── */}
        <div className="ai-card" id="card-suggestions">
          <div className="ai-card-header">
            <span className="ai-card-icon">💡</span>
            <h2 className="ai-card-title">SMART SUGGESTIONS</h2>
          </div>
          <p className="ai-card-desc">
            Get AI-powered recommendations on what to focus on today.
          </p>
          <button
            className="ai-action-btn"
            onClick={runSuggestions}
            disabled={sugLoading}
          >
            {sugLoading ? '⏳ Thinking…' : '▶ GET SUGGESTIONS'}
          </button>
          {sugData && (
            <div className="ai-result">
              <div className="ai-result-summary ai-result-summary--pre">
                {sugData.data || sugData.message || JSON.stringify(sugData)}
              </div>
            </div>
          )}
        </div>

        {/* ── MENTAL STATE ── */}
        <div className="ai-card ai-card--wide" id="card-mental">
          <div className="ai-card-header">
            <span className="ai-card-icon">🧘</span>
            <h2 className="ai-card-title">MENTAL STATE ANALYSIS</h2>
          </div>
          <p className="ai-card-desc">
            Share how you're feeling — AI detects your emotion and offers personalized support.
          </p>
          <div className="ai-mental-input-row">
            <textarea
              className="ai-mental-input"
              placeholder="How are you feeling right now? Write anything — a thought, a journal entry, a vent…"
              value={mentalInput}
              onChange={(e) => setMentalInput(e.target.value)}
              rows={3}
            />
            <button
              className="ai-action-btn"
              onClick={runMental}
              disabled={mentalLoading || !mentalInput.trim()}
            >
              {mentalLoading ? '⏳ Analyzing…' : '▶ ANALYZE'}
            </button>
          </div>
          {mentalResult && (
            <div className="ai-result ai-mental-result">
              <div className="ai-mental-badges">
                <div className="ai-mental-badge">
                  <span className="ai-mental-badge-label">Emotion</span>
                  <span className="ai-mental-badge-value">{mentalResult.emotion}</span>
                </div>
                <div className="ai-mental-badge">
                  <span className="ai-mental-badge-label">Intensity</span>
                  <ConfidenceBadge level={mentalResult.intensity} />
                </div>
              </div>
              {mentalResult.suggestion && (
                <div className="ai-mental-suggestion">
                  <strong>💡 Suggestion:</strong> {mentalResult.suggestion}
                </div>
              )}
              {mentalResult.ai_response && (
                <div className="ai-mental-response">
                  {mentalResult.ai_response}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BRAIN REFLECTION ── */}
        <div className="ai-card ai-card--wide ai-card--reflection" id="card-reflection">
          <div className="ai-card-header">
            <span className="ai-card-icon">🪞</span>
            <h2 className="ai-card-title">BRAIN REFLECTION</h2>
          </div>
          <p className="ai-card-desc">
            Look back at your journey — AI analyzes your growth, achievements, and patterns.
          </p>
          <button
            className="ai-action-btn"
            onClick={runReflection}
            disabled={reflectionLoading}
          >
            {reflectionLoading ? '⏳ Reflecting…' : '▶ REFLECT'}
          </button>
          {reflectionResult && reflectionResult.success && (
            <div className="ai-result ai-reflection-result">
              {reflectionResult.growth_summary && (
                <div className="reflection-summary">{reflectionResult.growth_summary}</div>
              )}
              {reflectionResult.achievements?.length > 0 && (
                <div className="reflection-section">
                  <div className="reflection-section-title">🏆 Achievements</div>
                  <ul className="reflection-list">
                    {reflectionResult.achievements.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reflectionResult.patterns?.length > 0 && (
                <div className="reflection-section">
                  <div className="reflection-section-title">📊 Patterns</div>
                  <ul className="reflection-list">
                    {reflectionResult.patterns.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reflectionResult.suggestions?.length > 0 && (
                <div className="reflection-section">
                  <div className="reflection-section-title">💡 Suggestions</div>
                  <ul className="reflection-list">
                    {reflectionResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {reflectionResult && !reflectionResult.success && (
            <div className="ai-result ai-result--error">
              ⚠️ {reflectionResult.error || 'Could not generate reflection. Try again later.'}
            </div>
          )}
        </div>
      </div>

      <FloatingElements items={['AI THINKING', 'GEMINI', 'NEURAL', '→', '◆', '▲']} />
    </main>
  )
}

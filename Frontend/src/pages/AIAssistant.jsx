import { useState, useCallback } from 'react'
import {
  getPrediction,
  prioritizeTasks,
  getMentalState,
  getSuggestions,
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

  return (
    <main className="ai-page">
      <div className="ai-header">
        <h1 className="ai-title">🧠 AI ASSISTANT</h1>
        <p className="ai-subtitle">
          Powered by Gemini — Predict, Prioritize, and Understand your mental state.
        </p>
      </div>

      {error && (
        <div className="ai-error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="ai-grid">
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
      </div>

      <FloatingElements items={['AI THINKING', 'GEMINI', 'NEURAL', '→', '◆', '▲']} />
    </main>
  )
}

import { useEffect, useState, useRef, useCallback } from 'react'
import FloatingElements from '../components/FloatingElements.jsx'
import {
  getTasks,
  createTask,
  updateTask,
  getScore,
  getAlerts,
  getDecision,
  getPrediction,
  getSchedule,
  getProactive,
  nlpCapture,
  getInsights,
  universalCapture,
} from '../api/secondbrain.js'
import '../styles/dashboard.css'

function defaultDeadlineLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function localInputToIso(localValue) {
  if (!localValue) {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString()
  }
  const d = new Date(localValue)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function formatDue(isoOrText) {
  if (!isoOrText) return '—'
  const d = new Date(isoOrText)
  if (Number.isNaN(d.getTime())) return isoOrText
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}


function mapTaskFromApi(t) {
  return {
    id: t.id,
    text: t.title,
    due: t.completed ? 'Done' : formatDue(t.deadline),
    done: t.completed,
    deadline: t.deadline,
  }
}

export default function Dashboard() {
  const [mainScore, setMainScore] = useState(0)
  const [prodScore, setProdScore] = useState(0)
  const [consScore, setConsScore] = useState(0)
  const [prodTarget, setProdTarget] = useState(70)
  const [consTarget, setConsTarget] = useState(65)
  const [predText, setPredText] = useState('')
  const [predFull, setPredFull] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskDueLocal, setTaskDueLocal] = useState(() => defaultDeadlineLocal())
  const [startBtnText, setStartBtnText] = useState('START TASK →')
  const [startBtnActive, setStartBtnActive] = useState(false)
  const [tasks, setTasks] = useState([])
  const [decisionReason, setDecisionReason] = useState('')
  const [scheduleRows, setScheduleRows] = useState([])
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [alertPrimary, setAlertPrimary] = useState('')
  const [alertSub, setAlertSub] = useState('')
  const [proactiveMsg, setProactiveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nlpText, setNlpText] = useState('')
  const [nlpLoading, setNlpLoading] = useState(false)
  const [nlpSuccess, setNlpSuccess] = useState(null)
  const [confidencePct, setConfidencePct] = useState(72)
  const [insights, setInsights] = useState([])
  const [insightMood, setInsightMood] = useState('neutral')
  const [captureText, setCaptureText] = useState('')
  const [captureLoading, setCaptureLoading] = useState(false)
  const [captureResult, setCaptureResult] = useState(null)

  const taskInputRef = useRef(null)
  const scoreAnimRef = useRef(null)

  const loadDashboard = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      // Phase 1: Load non-AI data first (fast) — show dashboard immediately
      const [taskList, score] = await Promise.all([
        getTasks({ sort_by: 'deadline', order: 'asc' }).catch(() => []),
        getScore().catch(() => null),
      ])

      setTasks((taskList || []).map(mapTaskFromApi))

      if (score) {
        const m = Math.min(100, Math.max(0, score.score ?? 0))
        const p = Math.min(100, Math.max(0, Math.round(score.completion_rate ?? 0)))
        const c = Math.min(100, Math.max(0, score.consistency_score ?? 0))
        setProdTarget(p)
        setConsTarget(c)
        if (scoreAnimRef.current) clearInterval(scoreAnimRef.current)
        let step = 0
        const targets = { main: m, prod: p, cons: c }
        scoreAnimRef.current = setInterval(() => {
          step++
          setMainScore(Math.min(targets.main, step * 2))
          setProdScore(Math.min(targets.prod, step * 2))
          setConsScore(Math.min(targets.cons, step * 2))
          if (step * 2 >= Math.max(targets.main, targets.prod, targets.cons)) {
            setMainScore(targets.main)
            setProdScore(targets.prod)
            setConsScore(targets.cons)
            clearInterval(scoreAnimRef.current)
            scoreAnimRef.current = null
          }
        }, 18)
      }

      // Show the dashboard NOW — AI data loads in background
      setLoading(false)

      // Phase 2: Load AI-powered data in background (fills in progressively)
      const alerts = await getAlerts().catch(() => null)
      if (alerts?.has_alerts && alerts.alerts?.length) {
        setAlertPrimary(alerts.alerts[0].message)
        setAlertSub(alerts.ai_summary ? String(alerts.ai_summary).slice(0, 220) : '')
      } else {
        setAlertPrimary('No critical alerts right now.')
        setAlertSub('Keep completing tasks to stay on track.')
      }

      const decision = await getDecision().catch(() => null)
      if (decision?.success) {
        const reason = decision.reason || ''
        const pick = decision.selected_task
          ? `"${decision.selected_task}" — ${reason}`
          : reason
        setDecisionReason(pick || 'Add tasks to get a personalized recommendation.')
      } else {
        setDecisionReason('Could not load recommendation.')
      }

      const prediction = await getPrediction().catch(() => null)
      if (prediction?.success) {
        const summary = prediction.summary || ''
        setPredFull(summary)
        setConfidencePct(typeof prediction.confidence === 'number' ? prediction.confidence : 0)
      } else {
        setPredFull('Predictions will appear once you add some tasks.')
        setConfidencePct(0)
      }

      const schedule = await getSchedule(8).catch(() => null)
      if (schedule?.success && Array.isArray(schedule.schedule) && schedule.schedule.length) {
        setScheduleRows(schedule.schedule)
        setScheduleNotes(schedule.ai_notes || '')
      } else {
        setScheduleRows([])
        setScheduleNotes(schedule?.ai_notes || 'Add pending tasks to generate a schedule.')
      }

      const proactive = await getProactive().catch(() => null)
      if (proactive?.message) {
        setProactiveMsg(proactive.message)
      } else {
        setProactiveMsg('')
      }

      const insightsData = await getInsights().catch(() => null)
      if (insightsData?.success && insightsData.insights?.length) {
        setInsights(insightsData.insights)
        setInsightMood(insightsData.mood || 'neutral')
      } else {
        setInsights([])
        setInsightMood('neutral')
      }
    } catch (e) {
      setError(e.message || 'Failed to load dashboard')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
    return () => {
      if (scoreAnimRef.current) clearInterval(scoreAnimRef.current)
    }
  }, [loadDashboard])

  useEffect(() => {
    if (!predFull) {
      setPredText('')
      return
    }
    let i = 0
    setPredText('')
    const interval = setInterval(() => {
      setPredText(predFull.slice(0, i + 1))
      i++
      if (i >= predFull.length) clearInterval(interval)
    }, 12)
    return () => clearInterval(interval)
  }, [predFull])

  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.bar-fill').forEach((bar) => {
        const target = bar.dataset.target
        if (target) bar.style.width = `${target}%`
      })
    }, 400)
    return () => clearTimeout(t)
  }, [prodTarget, consTarget, loading])

  useEffect(() => {
    const cards = document.querySelectorAll('.card')
    const handlers = []

    cards.forEach((card) => {
      const handleMove = (e) => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cx = rect.width / 2
        const cy = rect.height / 2
        const rotX = ((y - cy) / cy) * -2
        const rotY = ((x - cx) / cx) * 2
        card.style.transform = `translate(-3px, -3px) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      }
      const handleLeave = () => {
        card.style.transform = ''
      }

      card.addEventListener('mousemove', handleMove)
      card.addEventListener('mouseleave', handleLeave)
      handlers.push({ card, handleMove, handleLeave })
    })

    return () => {
      handlers.forEach(({ card, handleMove, handleLeave }) => {
        card.removeEventListener('mousemove', handleMove)
        card.removeEventListener('mouseleave', handleLeave)
      })
    }
  }, [tasks])

  const refreshScoresOnly = useCallback(async () => {
    try {
      const score = await getScore()
      if (!score) return
      const m = Math.min(100, Math.max(0, score.score ?? 0))
      const p = Math.min(100, Math.max(0, Math.round(score.completion_rate ?? 0)))
      const c = Math.min(100, Math.max(0, score.consistency_score ?? 0))
      setMainScore(m)
      setProdScore(p)
      setConsScore(c)
      setProdTarget(p)
      setConsTarget(c)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTask = useCallback(
    async (id) => {
      const t = tasks.find((x) => x.id === id)
      if (!t) return
      const nextDone = !t.done
      try {
        await updateTask(id, { status: nextDone ? 'completed' : 'pending' })
        setTasks((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, done: nextDone, due: nextDone ? 'Done' : formatDue(row.deadline) }
              : row
          )
        )
        await refreshScoresOnly()
      } catch (e) {
        setError(e.message || 'Could not update task')
      }
    },
    [tasks, refreshScoresOnly]
  )

  const addTask = useCallback(async () => {
    if (!taskName.trim()) return
    try {
      const iso = localInputToIso(taskDueLocal)
      const created = await createTask({
        title: taskName.trim(),
        deadline: iso,
        priority: 'medium',
      })
      setTaskName('')
      setTaskDueLocal(defaultDeadlineLocal())
      taskInputRef.current?.focus()
      setTasks((prev) => [...prev, mapTaskFromApi(created)])
      await refreshScoresOnly()
    } catch (e) {
      setError(e.message || 'Could not create task')
    }
  }, [taskName, taskDueLocal, refreshScoresOnly])

  const handleStartTask = () => {
    setStartBtnText('✓ STARTED')
    setStartBtnActive(true)
    setTimeout(() => {
      setStartBtnText('START TASK →')
      setStartBtnActive(false)
    }, 2000)
  }

  const handleNlpCapture = useCallback(async () => {
    if (!nlpText.trim()) return
    setNlpLoading(true)
    setNlpSuccess(null)
    try {
      const res = await nlpCapture(nlpText.trim())
      if (res.success) {
        setNlpSuccess(res.task?.title || 'Task created!')
        setNlpText('')
        setTasks((prev) => [...prev, mapTaskFromApi(res.task)])
        await refreshScoresOnly()
        setTimeout(() => setNlpSuccess(null), 4000)
      } else {
        setError(res.error || 'Could not parse task')
      }
    } catch (e) {
      setError(e.message || 'NLP capture failed')
    } finally {
      setNlpLoading(false)
    }
  }, [nlpText, refreshScoresOnly])

  const handleUniversalCapture = useCallback(async () => {
    if (!captureText.trim()) return
    setCaptureLoading(true)
    setCaptureResult(null)
    try {
      const res = await universalCapture(captureText.trim())
      setCaptureResult(res)
      if (res.success) {
        setCaptureText('')
        if (res.entry_type === 'task' && res.entry) {
          setTasks((prev) => [...prev, mapTaskFromApi(res.entry)])
          await refreshScoresOnly()
        }
        setTimeout(() => setCaptureResult(null), 5000)
      }
    } catch (e) {
      setError(e.message || 'Capture failed')
    } finally {
      setCaptureLoading(false)
    }
  }, [captureText, refreshScoresOnly])

  return (
    <main className="dashboard-page">
      {error && (
        <div className="dashboard-banner dashboard-banner--error" role="alert">
          {error}
          <button type="button" className="dashboard-banner-retry" onClick={() => loadDashboard()}>
            Retry
          </button>
        </div>
      )}
      {loading && <div className="dashboard-loading">Loading SecondBrain…</div>}

      {proactiveMsg && !loading && (
        <div className="dashboard-proactive" role="status">
          {proactiveMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION 1: Tasks + Score + Prediction (100vh)
          ═══════════════════════════════════════════════ */}
      <section className="dash-section dash-section--1">
        <div className="dash-section-grid dash-section-grid--1">
          {/* LEFT: Tasks — full height */}
          <div className="card card-tasks" id="card-tasks">
            <div className="card-label">📋 TASKS</div>
            <div className="task-list" id="task-list">
              {tasks.length === 0 && !loading && (
                <div className="task-row task-row--empty">No tasks yet. Add one below — data syncs with the FastAPI backend.</div>
              )}
              {tasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <span
                    className={`dash-task-check ${task.done ? 'dash-task-check--done' : 'dash-task-check--empty'}`}
                    onClick={() => toggleTask(task.id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleTask(task.id)}
                    role="button"
                    tabIndex={0}
                  >
                    {task.done ? '✓' : ''}
                  </span>
                  <span className={`task-text ${task.done ? 'task-text--done' : ''}`}>{task.text}</span>
                  <span className="task-due">{task.due}</span>
                </div>
              ))}
            </div>
            <button
              className="dash-btn btn-add"
              onClick={() => {
                setShowForm(!showForm)
                if (!showForm) setTimeout(() => taskInputRef.current?.focus(), 50)
              }}
            >
              + ADD TASK
            </button>

            {showForm && (
              <div className="add-task-form">
                <input
                  ref={taskInputRef}
                  type="text"
                  className="task-input"
                  placeholder="Task name..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <input
                  type="datetime-local"
                  className="task-input task-input--sm"
                  value={taskDueLocal}
                  onChange={(e) => setTaskDueLocal(e.target.value)}
                />
                <button type="button" className="dash-btn btn-confirm" onClick={addTask}>
                  ADD
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Score + Prediction stacked */}
          <div className="dash-section-right-stack">
            <div className="card card-score" id="card-score">
              <div className="card-label">🧠 YOUR SCORE</div>
              <div className="score-big">{mainScore}%</div>
              <div className="score-breakdown">
                <div className="score-row">
                  <span className="score-row-label">PRODUCTIVITY</span>
                  <div className="bar-track">
                    <div className="bar-fill bar-fill--prod" data-target={prodTarget} style={{ width: 0 }}></div>
                  </div>
                  <span className="score-row-val">{prodScore}%</span>
                </div>
                <div className="score-row">
                  <span className="score-row-label">CONSISTENCY</span>
                  <div className="bar-track">
                    <div className="bar-fill bar-fill--cons" data-target={consTarget} style={{ width: 0 }}></div>
                  </div>
                  <span className="score-row-val">{consScore}%</span>
                </div>
              </div>
            </div>

            <div className="card card-prediction" id="card-prediction">
              <div className="card-label">🔮 PREDICTION</div>
              <div className="prediction-box">
                <div className="prediction-icon">⚠</div>
                <p className="prediction-text">{predText}</p>
              </div>
              <div className="prediction-confidence">
                <span>CONFIDENCE:</span>
                <span className="confidence-val">{confidencePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THIN DIVIDER ─── */}
      <div className="dash-divider"></div>

      {/* ═══════════════════════════════════════════════
          SECTION 2: Do This Now + AI Schedule (100vh)
          ═══════════════════════════════════════════════ */}
      <section className="dash-section dash-section--2">
        <div className="dash-section-grid dash-section-grid--2">
          {/* LEFT: Do This Now — full height */}
          <div className="card card-decision" id="card-decision">
            <div className="card-label">🧠 DO THIS NOW</div>
            <p className="decision-text">{decisionReason}</p>
            <button
              type="button"
              className="dash-btn btn-start"
              onClick={handleStartTask}
              style={
                startBtnActive
                  ? {
                    background: 'var(--black)',
                    color: 'var(--neon)',
                    transform: 'translate(2px, 2px)',
                    boxShadow: '2px 2px 0 var(--black)',
                  }
                  : {}
              }
            >
              {startBtnText}
            </button>
          </div>

          {/* RIGHT: AI Schedule — full height */}
          <div className="card card-schedule" id="card-schedule">
            <div className="card-label">⏱️ AI SCHEDULE</div>
            <div className="schedule-list">
              {scheduleRows.length === 0 && (
                <div className="schedule-row schedule-row--muted">
                  <span className="schedule-task">{scheduleNotes || 'No schedule slots yet.'}</span>
                </div>
              )}
              {scheduleRows.map((row, i) => (
                <div className={`schedule-row ${i === 0 ? 'schedule-row--active' : ''}`} key={`${row.time}-${row.task}-${i}`}>
                  <span className="schedule-time">{row.time}</span>
                  <span className="schedule-sep">→</span>
                  <span className="schedule-task">{row.task}</span>
                  <span className={`schedule-status ${i === 0 ? 'schedule-status--now' : ''}`}>{i === 0 ? 'NOW' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── THIN DIVIDER ─── */}
      <div className="dash-divider"></div>

      {/* ═══════════════════════════════════════════════
          SECTION 3: Remaining cards
          ═══════════════════════════════════════════════ */}
      <section className="dash-section dash-section--3">
        <div className="dash-grid-remaining">
          <div className="card card-alert" id="card-alert">
            <div className="card-label">⚠️ ALERT</div>
            <div className="alert-box">
              <div className="alert-icon">🚨</div>
              <p className="alert-text">{alertPrimary}</p>
            </div>
            {alertSub && <div className="alert-sub">{alertSub}</div>}
          </div>

          <div className="card card-music" id="card-music">
            <div className="card-label">🎵 FOCUS MODE</div>
            <iframe
              style={{ border: 0, width: '100%', height: '100%', minHeight: '80px' }}
              src="https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM?utm_source=generator&theme=0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Focus Playlist"
            ></iframe>
          </div>

          <div className="card card-capture" id="card-capture">
            <div className="card-label">🧠 UNIVERSAL CAPTURE</div>
            <p className="capture-dash-desc">Type anything — AI classifies as task, idea, note, or goal</p>
            <div className="capture-dash-row">
              <div className="capture-dash-input-wrap">
                <span className="capture-dash-icon">✨</span>
                <input
                  type="text"
                  className="capture-dash-input"
                  placeholder="e.g. 'Exam in 3 days' or 'Learn guitar someday'"
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUniversalCapture()}
                  disabled={captureLoading}
                />
              </div>
              <button
                className="dash-btn btn-capture"
                onClick={handleUniversalCapture}
                disabled={captureLoading || !captureText.trim()}
              >
                {captureLoading ? '⏳' : '→'}
              </button>
            </div>
            {captureResult?.success && (
              <div className="capture-dash-success">
                ✅ {captureResult.entry_type?.toUpperCase()}: {captureResult.entry?.title || 'Created!'}
              </div>
            )}
            {captureResult && !captureResult.success && (
              <div className="capture-dash-error">⚠️ {captureResult.error || 'Failed'}</div>
            )}
          </div>

          <div className="card card-nlp" id="card-nlp">
            <div className="card-label">⚡ QUICK CAPTURE</div>
            <p className="nlp-dash-desc">Type anything — AI creates the task for you</p>
            <div className="nlp-dash-row">
              <div className="nlp-dash-input-wrap">
                <span className="nlp-dash-sparkle">✨</span>
                <input
                  type="text"
                  className="nlp-dash-input"
                  placeholder="e.g. 'Call dentist tomorrow at 3pm'"
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNlpCapture()}
                  disabled={nlpLoading}
                />
              </div>
              <button
                className="dash-btn btn-nlp"
                onClick={handleNlpCapture}
                disabled={nlpLoading || !nlpText.trim()}
              >
                {nlpLoading ? '⏳' : '→'}
              </button>
            </div>
            {nlpSuccess && (
              <div className="nlp-dash-success">✅ Created: {nlpSuccess}</div>
            )}
          </div>
        </div>
      </section>

      {/* Insights below the 2x2 grid */}
      {insights.length > 0 && (
        <div className="dash-insights-extra">
          <div className="card card-insights" id="card-insights">
            <div className="card-label">💡 DAILY INSIGHTS <span className="insight-mood">Mood: {insightMood}</span></div>
            <div className="insights-list">
              {insights.map((insight, i) => (
                <div className="insight-item" key={i}>
                  <span className="insight-number">{i + 1}</span>
                  <span className="insight-text">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <FloatingElements items={['AI THINKING', 'OPTIMIZED', 'NO EXCUSES', '', '', '']} />
    </main>
  )
}

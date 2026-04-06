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

function confidenceToPercent(c) {
  const v = (c || '').toLowerCase()
  if (v === 'high') return 88
  if (v === 'low') return 45
  return 72
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
  const [confidencePct, setConfidencePct] = useState(72)

  const taskInputRef = useRef(null)
  const scoreAnimRef = useRef(null)

  const loadDashboard = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [taskList, score, alerts, decision, prediction, schedule, proactive] = await Promise.all([
        getTasks({ sort_by: 'deadline', order: 'asc' }).catch(() => []),
        getScore().catch(() => null),
        getAlerts().catch(() => null),
        getDecision().catch(() => null),
        getPrediction().catch(() => null),
        getSchedule(8).catch(() => null),
        getProactive().catch(() => null),
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

      if (alerts?.has_alerts && alerts.alerts?.length) {
        setAlertPrimary(alerts.alerts[0].message)
        setAlertSub(alerts.ai_summary ? String(alerts.ai_summary).slice(0, 220) : '')
      } else {
        setAlertPrimary('No critical alerts right now.')
        setAlertSub('Keep completing tasks to stay on track.')
      }

      if (decision?.success) {
        const reason = decision.reason || ''
        const pick = decision.selected_task
          ? `"${decision.selected_task}" — ${reason}`
          : reason
        setDecisionReason(pick || 'Add tasks to get a personalized recommendation.')
      } else {
        setDecisionReason('Could not load recommendation.')
      }

      if (prediction?.success) {
        const summary = prediction.summary || ''
        setPredFull(summary)
        setConfidencePct(confidenceToPercent(prediction.confidence))
      } else {
        setPredFull('Predictions will appear once the backend and AI are configured.')
        setConfidencePct(0)
      }

      if (schedule?.success && Array.isArray(schedule.schedule) && schedule.schedule.length) {
        setScheduleRows(schedule.schedule)
        setScheduleNotes(schedule.ai_notes || '')
      } else {
        setScheduleRows([])
        setScheduleNotes(schedule?.ai_notes || 'Add pending tasks to generate a schedule.')
      }

      if (proactive?.message) {
        setProactiveMsg(proactive.message)
      } else {
        setProactiveMsg('')
      }
    } catch (e) {
      setError(e.message || 'Failed to load dashboard')
    } finally {
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

      <div className="dash-grid">
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

        <div className="card card-features" id="card-features">
          <div className="card-label">🚀 UPCOMING FEATURES</div>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <div className="feature-title">AI AUTO-SCHEDULER</div>
                <div className="feature-desc">Auto-plan your entire week based on deadlines &amp; energy levels</div>
              </div>
              <span className="feature-tag feature-tag--soon">SOON</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <div className="feature-title">DEEP ANALYTICS</div>
                <div className="feature-desc">Weekly performance reports with AI-driven insights</div>
              </div>
              <span className="feature-tag feature-tag--beta">BETA</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔗</span>
              <div>
                <div className="feature-title">INTEGRATIONS</div>
                <div className="feature-desc">Connect with GitHub, Notion, Google Calendar &amp; more</div>
              </div>
              <span className="feature-tag feature-tag--planned">Q3</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🧬</span>
              <div>
                <div className="feature-title">HABIT DNA</div>
                <div className="feature-desc">AI maps your habit patterns and suggests optimizations</div>
              </div>
              <span className="feature-tag feature-tag--planned">Q4</span>
            </div>
          </div>
        </div>
      </div>

      <FloatingElements items={['AI THINKING', 'OPTIMIZED', 'NO EXCUSES', '→', '◆', '▲']} />
    </main>
  )
}

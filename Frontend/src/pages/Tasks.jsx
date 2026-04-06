import { useEffect, useState, useRef, useCallback } from 'react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../api/secondbrain.js'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/tasks.css'

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
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all | pending | completed
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showForm, setShowForm] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDueLocal, setTaskDueLocal] = useState(() => defaultDeadlineLocal())
  const [deletingId, setDeletingId] = useState(null)
  const inputRef = useRef(null)

  const loadTasks = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      if (sortBy) params.sort_by = sortBy
      if (sortOrder) params.order = sortOrder
      const list = await getTasks(params)
      setTasks(list || [])
    } catch (e) {
      setError(e.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [filter, sortBy, sortOrder])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleAdd = useCallback(async () => {
    if (!taskName.trim()) return
    try {
      const iso = localInputToIso(taskDueLocal)
      await createTask({
        title: taskName.trim(),
        deadline: iso,
        priority: taskPriority,
      })
      setTaskName('')
      setTaskDueLocal(defaultDeadlineLocal())
      setTaskPriority('medium')
      inputRef.current?.focus()
      await loadTasks()
    } catch (e) {
      setError(e.message || 'Could not create task')
    }
  }, [taskName, taskDueLocal, taskPriority, loadTasks])

  const handleToggle = useCallback(
    async (task) => {
      const nextStatus = task.completed ? 'pending' : 'completed'
      try {
        await updateTask(task.id, { status: nextStatus })
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, completed: !t.completed, status: nextStatus }
              : t
          )
        )
      } catch (e) {
        setError(e.message || 'Could not update task')
      }
    },
    []
  )

  const handleDelete = useCallback(
    async (taskId) => {
      setDeletingId(taskId)
      try {
        await deleteTask(taskId)
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      } catch (e) {
        setError(e.message || 'Could not delete task')
      } finally {
        setDeletingId(null)
      }
    },
    []
  )

  const pendingCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <main className="tasks-page">
      <div className="tasks-header">
        <div>
          <h1 className="tasks-title">📋 TASK MANAGER</h1>
          <p className="tasks-subtitle">
            {tasks.length} total · {pendingCount} pending · {completedCount} completed
          </p>
        </div>
        <button
          className="tasks-btn tasks-btn--add"
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) setTimeout(() => inputRef.current?.focus(), 50)
          }}
        >
          {showForm ? '✕ CLOSE' : '+ NEW TASK'}
        </button>
      </div>

      {error && (
        <div className="tasks-error" role="alert">
          {error}
          <button type="button" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="tasks-form">
          <input
            ref={inputRef}
            type="text"
            className="tasks-input"
            placeholder="What needs to be done?"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="datetime-local"
            className="tasks-input tasks-input--date"
            value={taskDueLocal}
            onChange={(e) => setTaskDueLocal(e.target.value)}
          />
          <select
            className="tasks-input tasks-input--select"
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          <button className="tasks-btn tasks-btn--confirm" onClick={handleAdd}>
            ADD TASK
          </button>
        </div>
      )}

      <div className="tasks-controls">
        <div className="tasks-filters">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              className={`tasks-filter ${filter === f ? 'tasks-filter--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="tasks-sort">
          <select
            className="tasks-input tasks-input--select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Date Created</option>
            <option value="deadline">Deadline</option>
            <option value="priority">Priority</option>
          </select>
          <button
            className="tasks-sort-btn"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {loading && <div className="tasks-loading">Loading tasks…</div>}

      <div className="tasks-list">
        {!loading && tasks.length === 0 && (
          <div className="tasks-empty">
            <span className="tasks-empty-icon">📭</span>
            <p>No tasks found. Create your first task above!</p>
          </div>
        )}
        {tasks.map((task) => (
          <div
            className={`tasks-card ${task.completed ? 'tasks-card--done' : ''}`}
            key={task.id}
          >
            <button
              className={`tasks-check ${task.completed ? 'tasks-check--done' : ''}`}
              onClick={() => handleToggle(task)}
              aria-label={task.completed ? 'Mark pending' : 'Mark complete'}
            >
              {task.completed ? '✓' : ''}
            </button>
            <div className="tasks-card-body">
              <span className={`tasks-card-title ${task.completed ? 'tasks-card-title--done' : ''}`}>
                {task.title}
              </span>
              <div className="tasks-card-meta">
                <span className={`tasks-priority tasks-priority--${task.priority}`}>
                  {task.priority?.toUpperCase()}
                </span>
                <span className="tasks-due">
                  {task.completed ? '✅ Completed' : formatDue(task.deadline)}
                </span>
                {task.hours_spent > 0 && (
                  <span className="tasks-hours">{task.hours_spent}h spent</span>
                )}
              </div>
            </div>
            <button
              className="tasks-delete"
              onClick={() => handleDelete(task.id)}
              disabled={deletingId === task.id}
              aria-label="Delete task"
            >
              {deletingId === task.id ? '…' : '🗑'}
            </button>
          </div>
        ))}
      </div>

      <FloatingElements items={['FOCUS', 'EXECUTE', 'SHIP IT', '→', '◆', '▲']} />
    </main>
  )
}

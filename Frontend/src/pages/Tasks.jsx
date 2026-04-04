import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, Filter, ArrowUpDown } from "lucide-react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

function formatDeadline(deadline) {
  try {
    const d = new Date(deadline);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (diff < 0) return `⚠️ Overdue · ${dateStr}`;
    if (diff < 24) return `🔴 ${Math.round(diff)}h left · ${timeStr}`;
    if (diff < 72) return `🟡 ${Math.round(diff / 24)}d left · ${dateStr}`;
    return `${dateStr} · ${timeStr}`;
  } catch {
    return deadline;
  }
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [form, setForm] = useState({ title: "", deadline: "", priority: "medium" });

  useEffect(() => {
    loadTasks();
  }, [statusFilter, sortBy]);

  async function loadTasks() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (sortBy) {
        params.sort_by = sortBy;
        params.order = sortBy === "priority" ? "desc" : "asc";
      }
      const data = await fetchTasks(params);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.deadline) return;
    try {
      await createTask({
        title: form.title,
        deadline: new Date(form.deadline).toISOString(),
        priority: form.priority,
      });
      setForm({ title: "", deadline: "", priority: "medium" });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  }

  async function handleToggle(task) {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>📋 Tasks</h2>
        <p>Manage your tasks, mark complete, and stay organized</p>
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? "Cancel" : "Add Task"}
        </button>

        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <ArrowUpDown size={16} style={{ color: "var(--text-muted)" }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Default Sort</option>
            <option value="deadline">By Deadline</option>
            <option value="priority">By Priority</option>
            <option value="created_at">By Created</option>
          </select>
        </div>
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            className="card"
            style={{ marginBottom: 20 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
          >
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ minWidth: 120, flex: "unset" }}>
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Task
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No tasks yet. Click "Add Task" to get started!</p>
        </div>
      ) : (
        <div className="task-list">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                className={`task-card ${task.completed ? "completed" : ""}`}
                layout
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <button
                  className={`task-check ${task.completed ? "checked" : ""}`}
                  onClick={() => handleToggle(task)}
                  title={task.completed ? "Mark as pending" : "Mark as complete"}
                >
                  {task.completed && <Check size={14} />}
                </button>

                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                    <span>{formatDeadline(task.deadline)}</span>
                    {task.hours_spent > 0 && <span>⏱ {task.hours_spent}h</span>}
                  </div>
                </div>

                <div className="task-actions">
                  <button onClick={() => handleDelete(task.id)} title="Delete task">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

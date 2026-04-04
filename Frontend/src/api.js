const API_BASE = "http://localhost:8000/api";

// ─── TASKS ──────────────────────────────────
export async function fetchTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(task) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id, data) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

// ─── AI ENDPOINTS ───────────────────────────
export async function fetchScore() {
  const res = await fetch(`${API_BASE}/ai/score`);
  if (!res.ok) throw new Error("Failed to fetch score");
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/ai/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchDecision() {
  const res = await fetch(`${API_BASE}/ai/decide`);
  if (!res.ok) throw new Error("Failed to fetch decision");
  return res.json();
}

export async function fetchPrediction() {
  const res = await fetch(`${API_BASE}/ai/predict`);
  if (!res.ok) throw new Error("Failed to fetch prediction");
  return res.json();
}

export async function fetchSchedule(hours = 8) {
  const res = await fetch(`${API_BASE}/ai/schedule?hours=${hours}`);
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}

export async function fetchProactive() {
  const res = await fetch(`${API_BASE}/ai/proactive`);
  if (!res.ok) throw new Error("Failed to fetch proactive insight");
  return res.json();
}

export async function fetchSuggestions() {
  const res = await fetch(`${API_BASE}/ai/suggestions`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export async function analyzeMentalState(text) {
  const res = await fetch(`${API_BASE}/ai/mental`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to analyze mental state");
  return res.json();
}

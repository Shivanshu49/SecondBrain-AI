import { apiFetch } from './client.js'

export function getTasks(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.sort_by) q.set('sort_by', params.sort_by)
  if (params.order) q.set('order', params.order)
  const s = q.toString()
  return apiFetch(`/api/tasks${s ? `?${s}` : ''}`)
}

export function createTask(body) {
  return apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(body) })
}

export function updateTask(taskId, body) {
  return apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteTask(taskId) {
  return apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
}

export function getScore() {
  return apiFetch('/api/ai/score')
}

export function getAlerts() {
  return apiFetch('/api/ai/alerts')
}

export function getDecision() {
  return apiFetch('/api/ai/decide')
}

export function getPrediction() {
  return apiFetch('/api/ai/predict')
}

export function getSchedule(hours = 8) {
  return apiFetch(`/api/ai/schedule?hours=${hours}`)
}

export function getProactive() {
  return apiFetch('/api/ai/proactive')
}

export function getMentalState(text) {
  return apiFetch('/api/ai/mental', { method: 'POST', body: JSON.stringify({ text }) })
}

export function analyzeMentalState(text) {
  return apiFetch('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ text }) })
}

export function prioritizeTasks() {
  return apiFetch('/api/ai/prioritize')
}

export function getSuggestions() {
  return apiFetch('/api/ai/suggestions')
}

// ─── NEW: NLP Quick Capture ───
export function nlpCapture(text) {
  return apiFetch('/api/ai/nlp-capture', { method: 'POST', body: JSON.stringify({ text }) })
}

// ─── NEW: Goal Decomposition ───
export function decomposeGoal(goal) {
  return apiFetch('/api/ai/goal', { method: 'POST', body: JSON.stringify({ goal }) })
}

// ─── NEW: Brain Dump ───
export function brainDump(text) {
  return apiFetch('/api/ai/braindump', { method: 'POST', body: JSON.stringify({ text }) })
}

// ─── STEP 2: Universal Capture ───
export function universalCapture(text) {
  return apiFetch('/api/ai/capture', { method: 'POST', body: JSON.stringify({ text }) })
}

// ─── STEP 4: Daily Insights ───
export function getInsights() {
  return apiFetch('/api/ai/insights')
}

// ─── STEP 9: Brain Reflection ───
export function getReflection() {
  return apiFetch('/api/ai/reflection')
}

// ─── STEP 6: Entry Connections ───
export function getRelatedEntries(entryId) {
  return apiFetch(`/api/ai/entries/${entryId}/related`)
}

export function connectEntry(entryId) {
  return apiFetch(`/api/ai/entries/${entryId}/connect`, { method: 'POST' })
}

// ─── Entries CRUD ───
export function getEntries(params = {}) {
  const q = new URLSearchParams()
  if (params.type) q.set('type', params.type)
  if (params.status) q.set('status', params.status)
  if (params.sort_by) q.set('sort_by', params.sort_by)
  if (params.order) q.set('order', params.order)
  const s = q.toString()
  return apiFetch(`/api/entries${s ? `?${s}` : ''}`)
}

export function createEntry(body) {
  return apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(body) })
}

export function updateEntry(entryId, body) {
  return apiFetch(`/api/entries/${entryId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteEntry(entryId) {
  return apiFetch(`/api/entries/${entryId}`, { method: 'DELETE' })
}

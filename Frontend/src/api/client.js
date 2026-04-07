/**
 * Base URL for the FastAPI backend.
 * In dev, Vite proxies /api → http://127.0.0.1:8000 (see vite.config.js).
 * For production, set VITE_API_URL to your API origin (e.g. https://api.example.com).
 */
const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function apiFetch(path, options = {}) {
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const token = localStorage.getItem('sb-token')
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail = typeof data === 'object' && data?.detail != null
      ? (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ') : String(data.detail))
      : res.statusText
    throw new Error(detail || `Request failed: ${res.status}`)
  }
  return data
}

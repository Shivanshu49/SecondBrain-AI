import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

const API = '/api/auth'

async function authFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Auth failed')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('sb-token'))
  const [loading, setLoading] = useState(true)

  // On mount, verify stored token
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('sb-token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const signup = useCallback(async (name, email, password) => {
    const data = await authFetch('/signup', { name, email, password })
    localStorage.setItem('sb-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authFetch('/login', { email, password })
    localStorage.setItem('sb-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sb-token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

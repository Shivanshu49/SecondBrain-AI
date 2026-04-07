import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        color: 'var(--muted)',
      }}>
        Loading…
      </div>
    )
  }

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />
  // }

  return children
}

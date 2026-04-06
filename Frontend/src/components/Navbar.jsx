import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from './ThemeProvider.jsx'
import { useAuth } from './AuthProvider.jsx'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, logout, user } = useAuth()
  const isApp = ['/dashboard', '/tasks', '/ai', '/schedule'].includes(location.pathname)

  const handleAboutClick = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById('about-slider')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById('about-slider')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const handleLogout = (e) => {
    e.preventDefault()
    logout()
    navigate('/')
  }

  return (
    <nav id="navbar" className={isApp ? 'navbar--dashboard' : ''}>
      <Link to={isAuthenticated ? '/dashboard' : '/'} className="nav-logo">
        SecondBrain <span className="logo-accent">AI</span>
      </Link>
      <div className="nav-links">
        {isApp ? (
          <>
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'nav-link--active' : ''}`} id="nav-dashboard">Dashboard</Link>
            <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'nav-link--active' : ''}`} id="nav-tasks">Tasks</Link>
            <Link to="/ai" className={`nav-link ${location.pathname === '/ai' ? 'nav-link--active' : ''}`} id="nav-ai">AI</Link>
            <Link to="/schedule" className={`nav-link ${location.pathname === '/schedule' ? 'nav-link--active' : ''}`} id="nav-schedule">Schedule</Link>
            <a href="#" className="nav-link nav-link--logout" id="nav-logout" onClick={handleLogout}>Logout</a>
          </>
        ) : (
          <>
            <a href="#about-slider" className="nav-link" id="nav-about" onClick={handleAboutClick}>About</a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="nav-link nav-link--login" id="nav-login">Dashboard</Link>
            ) : (
              <Link to="/login" className="nav-link nav-link--login" id="nav-login">Login</Link>
            )}
          </>
        )}
        <button
          className="theme-toggle"
          id="theme-toggle"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          <span className="icon-moon" style={{
            opacity: theme === 'dark' ? 0 : 1,
            transform: theme === 'dark' ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)'
          }}>🌙</span>
          <span className="icon-sun" style={{
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)'
          }}>☀️</span>
        </button>
      </div>
    </nav>
  )
}

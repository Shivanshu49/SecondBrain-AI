import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('secondbrain-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  const overlayRef = useRef(null)

  // Apply theme to <html> on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Create overlay element once
  useEffect(() => {
    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-overlay'
    document.body.appendChild(overlay)
    overlayRef.current = overlay
    return () => {
      document.body.removeChild(overlay)
    }
  }, [])

  const toggleTheme = useCallback((e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    const overlay = overlayRef.current
    if (!overlay) return

    // Get click position for circular reveal
    const x = e ? e.clientX : window.innerWidth / 2
    const y = e ? e.clientY : window.innerHeight / 2

    overlay.style.setProperty('--reveal-x', x + 'px')
    overlay.style.setProperty('--reveal-y', y + 'px')
    overlay.style.background = nextTheme === 'dark' ? '#0d0d0d' : '#f5f0e8'

    // Start reveal animation
    overlay.classList.add('theme-transition-active')

    // Swap theme at midpoint
    setTimeout(() => {
      setTheme(nextTheme)
      localStorage.setItem('secondbrain-theme', nextTheme)
    }, 300)

    // Clean up overlay
    setTimeout(() => {
      overlay.classList.remove('theme-transition-active')
    }, 600)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

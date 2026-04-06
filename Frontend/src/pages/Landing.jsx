import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/landing.css'

const principles = [
  { num: '01', title: 'SMART TASK MANAGEMENT', desc: 'Easily add, edit, and manage your daily tasks. SecondBrain AI organizes everything in one place.' },
  { num: '02', title: 'SMART ALERTS', desc: 'Get timely notifications and reminders so you never miss important tasks or deadlines.' },
  { num: '03', title: 'MUSIC MODE', desc: 'Boost productivity with built-in focus music. Choose ambient sounds or playlists to stay in the zone.' },
  { num: '04', title: 'DARK MODE', desc: 'Switch between light and dark themes for comfort, reducing eye strain during long sessions.' },
  { num: '05', title: 'SMART SCHEDULING', desc: 'AI automatically creates your daily schedule by analyzing tasks, deadlines, and priorities.' },
]

export default function Landing() {
  const [scoreCount, setScoreCount] = useState(0)
  const [aiText, setAiText] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const cardRef = useRef(null)
  const sliderRef = useRef(null)
  const autoPlayRef = useRef(null)
  const fullAiText = '"Do DSA now. Deadline tomorrow."'
  const totalSlides = 4

  // Typing effect for AI message
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setAiText(fullAiText.slice(0, i + 1))
      i++
      if (i >= fullAiText.length) clearInterval(interval)
    }, 55)
    return () => clearInterval(interval)
  }, [])

  // Score counter
  useEffect(() => {
    let current = 0
    const target = 72
    const interval = setInterval(() => {
      current++
      setScoreCount(current)
      if (current >= target) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [])

  // Tilt effect on dashboard card
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2
      const rotX = ((y - cy) / cy) * -3
      const rotY = ((x - cx) / cx) * 3
      card.style.transform = `rotate(0deg) scale(1.02) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'rotate(2deg)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying) return
    autoPlayRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % totalSlides)
    }, 5000)
    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying])

  const goToSlide = (index) => {
    setActiveSlide(index)
    setIsAutoPlaying(false)
    // Restart auto-play after 10s of inactivity
    clearTimeout(autoPlayRef.current)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextSlide = () => goToSlide((activeSlide + 1) % totalSlides)
  const prevSlide = () => goToSlide((activeSlide - 1 + totalSlides) % totalSlides)

  const slideLabels = ['MANIFESTO', 'MISSION', 'FEATURES', 'TEAM']

  return (
    <div className="landing-page">
      <main id="hero">
        {/* LEFT */}
        <section className="hero-left">
          <h1 className="hero-heading">
            STOP THINKING.<br />
            <span className="heading-highlight">START WINNING.</span>
          </h1>
          <p className="hero-sub">
            SecondBrain AI predicts your actions, prioritizes your tasks, and makes decisions <strong>before you do.</strong>
          </p>
          <div className="hero-cta">
            <Link to="/login" className="btn btn-primary" id="cta-get-started">GET STARTED</Link>
            <a href="#about-slider" className="btn btn-outline" id="cta-see-demo">LEARN MORE ↓</a>
          </div>
        </section>

        {/* RIGHT — Mock Dashboard Card */}
        <section className="hero-right">
          <div className="dashboard-card" ref={cardRef}>
            <div className="card-header">
              <span className="card-dot dot-red"></span>
              <span className="card-dot dot-yellow"></span>
              <span className="card-dot dot-green"></span>
              <span className="card-title">DASHBOARD</span>
            </div>

            <div className="card-section">
              <div className="section-label">TODAY'S TASKS</div>
              <div className="task-item task-done">
                <span className="task-check">✓</span>
                <span>Review pull requests</span>
              </div>
              <div className="task-item task-done">
                <span className="task-check">✓</span>
                <span>Ship landing page</span>
              </div>
              <div className="task-item task-active">
                <span className="task-check task-check--empty"></span>
                <span>Practice DSA</span>
                <span className="task-tag">URGENT</span>
              </div>
              <div className="task-item">
                <span className="task-check task-check--empty"></span>
                <span>Read system design</span>
              </div>
            </div>

            <div className="card-section score-section">
              <div className="section-label">PRODUCTIVITY</div>
              <div className="score-bar-wrapper">
                <div className="score-bar">
                  <div className="score-fill"></div>
                </div>
                <span className="score-value">{scoreCount}%</span>
              </div>
            </div>

            <div className="card-section ai-section">
              <div className="ai-label">
                <span className="ai-icon">⚡</span> AI SUGGESTION
              </div>
              <div className="ai-message">{aiText}</div>
            </div>
          </div>
        </section>

        <FloatingElements items={['AI INSIDE', 'SMART > HARD', '→', '★', '◆', '▲']} />
      </main>

      {/* ===== ABOUT SLIDER SECTION ===== */}
      <section className="about-slider-section" id="about-slider">
        <div className="slider-header">
          <div className="slider-tag">// ABOUT US</div>
          <h2 className="slider-title">
            DISCOVER <span className="heading-highlight">MORE</span>
          </h2>
          <p className="slider-subtitle">Swipe through to learn what makes SecondBrain AI different.</p>
        </div>

        <div className="slider-container">
          <button className="slider-arrow slider-arrow--left" onClick={prevSlide} aria-label="Previous slide" id="slider-prev">
            ←
          </button>

          <div className="slider-viewport" ref={sliderRef}>
            <div
              className="slider-track"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {/* SLIDE 1 — Manifesto */}
              <div className="slider-slide">
                <div className="slide-content slide-manifesto">
                  <div className="slide-number">01</div>
                  <h3 className="slide-heading">THE MANIFESTO.</h3>
                  <p className="slide-text">
                    We don't build apps. We build <strong>cognitive infrastructure</strong> —
                    an AI layer that thinks before you do, acts before you stall, and optimizes
                    every second of your life.
                  </p>
                  <div className="slide-accent-bar"></div>
                  <p className="slide-quote">"Your brain should focus on thinking, not storing everything."</p>
                </div>
              </div>

              {/* SLIDE 2 — Mission */}
              <div className="slider-slide">
                <div className="slide-content slide-mission">
                  <div className="slide-number">02</div>
                  <h3 className="slide-heading">WHY WE EXIST</h3>
                  <div className="slide-mission-card">
                    <div className="slide-mission-label">
                      <span>⚡</span> OUR MISSION
                    </div>
                    <p className="slide-text">
                      We exist to eliminate <strong>mental overload</strong> in a world flooded with information.
                      People plan more than they execute, remember less than they consume, and lose valuable ideas in the noise.
                    </p>
                    <p className="slide-text" style={{ marginTop: '12px' }}>
                      <strong>SecondBrain AI</strong> is built to act as your external memory — capturing thoughts, organizing tasks,
                      and retrieving what matters at the right time.
                    </p>
                  </div>
                </div>
              </div>

              {/* SLIDE 3 — Features */}
              <div className="slider-slide">
                <div className="slide-content slide-features">
                  <div className="slide-number">03</div>
                  <h3 className="slide-heading">FEATURES</h3>
                  <div className="slide-features-grid">
                    {principles.map(p => (
                      <div className="slide-feature-item" key={p.num}>
                        <span className="slide-feature-num">{p.num}</span>
                        <div>
                          <div className="slide-feature-title">{p.title}</div>
                          <div className="slide-feature-desc">{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SLIDE 4 — Team + CTA */}
              <div className="slider-slide">
                <div className="slide-content slide-team">
                  <div className="slide-number">04</div>
                  <h3 className="slide-heading">
                    TEAM <span className="heading-highlight" style={{ fontSize: 'inherit' }}>ETERNITYX</span>
                  </h3>
                  <p className="slide-text">
                    EternityX is a team of builders focused on creating intelligent systems that simplify life.
                    We design and develop solutions that combine AI, productivity, and user experience into one seamless platform.
                  </p>
                  <div className="slide-team-card">
                    <div className="slide-team-avatar">⚡</div>
                    <div>
                      <div className="slide-team-name">ETERNITYX</div>
                      <div className="slide-team-role">AI PRODUCT TEAM</div>
                      <span className="slide-team-tag">INNOVATION</span>
                    </div>
                  </div>
                  <div className="slide-cta-row">
                    <Link to="/login" className="btn btn-primary" id="cta-slider-start">ENTER THE DASHBOARD →</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="slider-arrow slider-arrow--right" onClick={nextSlide} aria-label="Next slide" id="slider-next">
            →
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="slider-dots">
          {slideLabels.map((label, i) => (
            <button
              key={i}
              className={`slider-dot ${activeSlide === i ? 'slider-dot--active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}: ${label}`}
              id={`slider-dot-${i}`}
            >
              <span className="dot-label">{label}</span>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="slider-progress">
          <div
            className="slider-progress-fill"
            style={{ width: `${((activeSlide + 1) / totalSlides) * 100}%` }}
          ></div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <span>© 2026 SECONDBRAIN AI</span>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </footer>
    </div>
  )
}

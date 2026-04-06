import { Link } from 'react-router-dom'
import FloatingElements from '../components/FloatingElements.jsx'
import '../styles/about.css'

const principles = [
  { num: '01', title: 'SMART TASK MANAGEMENT', desc: 'Easily add, edit, and manage your daily tasks. SecondBrain AI organizes everything in one place so you always know what needs to be done next.' },
  { num: '02', title: 'SMART ALERTS', desc: 'Get timely notifications and reminders so you never miss important tasks or deadlines, keeping you always on track.' },
  { num: '03', title: 'MUSIC MODE', desc: 'Boost your productivity with built-in focus music. Choose ambient sounds or playlists to stay in the zone while working.' },
  { num: '04', title: 'DARK MODE', desc: 'Switch between light and dark themes for a comfortable viewing experience, reducing eye strain during long work sessions.' },
  { num: '05', title: 'SMART SCHEDULING', desc: 'SecondBrain AI automatically creates your daily schedule by analyzing your tasks, deadlines, and priorities — so you always know what to do and when to do it.' },
]

export default function About() {
  return (
    <main className="about-page" id="about-main">

      {/* ===== HERO / MANIFESTO ===== */}
      <section className="about-hero" id="hero">
        <div className="about-tag">// ABOUT US</div>
        <h1 className="about-heading">
          THE<br />
          <span className="heading-highlight">MANIFESTO.</span>
        </h1>
        <p className="about-subtitle">
          We don't build apps. We build <strong>cognitive infrastructure</strong> —
          an AI layer that thinks before you do, acts before you stall, and optimizes
          every second of your life.
        </p>
        <div className="about-cta">
          <Link to="/dashboard" className="btn btn-primary" id="cta-start">GET STARTED</Link>
          <a href="#mission" className="btn btn-outline" id="cta-learn">READ MORE ↓</a>
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="about-section" id="mission">
        <div className="section-tag">01 — MISSION</div>
        <h2 className="section-heading">WHY WE EXIST</h2>
        <div className="mission-card">
          <div className="mission-label">
            <span className="mission-label-icon">⚡</span> OUR MISSION
          </div>
          <p className="mission-text">
            We exist to eliminate <strong>mental overload</strong> in a world flooded with information.
            <br /><br />
            People plan more than they execute, remember less than they consume, and lose valuable ideas in the noise.
            <br /><br />
            <strong>SecondBrain AI</strong> is built to act as your external memory—capturing thoughts, organizing tasks,
            and retrieving what matters at the right time.
            <br /><br />
            Because your brain should focus on <strong>thinking</strong>, not storing everything.
          </p>
        </div>
      </section>

      {/* ===== FEATURES / DNA ===== */}
      <section className="about-section" id="principles">
        <div className="section-tag">02 — DNA</div>
        <h2 className="section-heading">FEATURES</h2>
        <div className="principles-grid">
          {principles.map(p => (
            <div className="principle-card" key={p.num}>
              <div className="principle-number">{p.num}</div>
              <div className="principle-title">{p.title}</div>
              <div className="principle-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="about-section" id="team">
        <div className="section-tag">04 — BUILDERS</div>
        <h2 className="section-heading">
          TEAM <span className="heading-highlight">ETERNITYX</span>
        </h2>
        <p className="section-body">
          EternityX is a team of builders focused on creating intelligent systems that simplify life.
          We design and develop solutions that combine AI, productivity, and user experience into one seamless platform.
        </p>
        <div className="builders-row">
          <div className="builder-card">
            <div className="builder-avatar">⚡</div>
            <div className="builder-name">ETERNITYX</div>
            <div className="builder-role">AI PRODUCT TEAM</div>
            <span className="builder-tag builder-tag--eng">INNOVATION</span>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-banner" id="cta-banner">
        <h2 className="cta-heading">STOP READING. START EXECUTING.</h2>
        <p className="cta-sub">Your second brain is waiting. Skip the thinking — let the AI handle it.</p>
        <Link to="/dashboard" className="btn btn-primary" id="cta-final">ENTER THE DASHBOARD →</Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="about-footer">
        <span>© 2026 SECONDBRAIN AI</span>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </footer>

      <FloatingElements items={['BUILT FOR SPEED', 'LOGIC FIRST', 'ZERO FRICTION', '★', '◆', '▲']} />
    </main>
  )
}

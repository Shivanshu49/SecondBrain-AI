import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Zap,
  BarChart3,
  MessageCircle,
  CalendarClock,
  Target,
  ArrowRight,
  Play,
  Shield,
  Sparkles,
  TrendingUp,
  Eye,
  Mail,
} from "lucide-react";
import "./Landing.css";

/* ─── PARTICLES ─────────────────────────────── */
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 8 + Math.random() * 12,
    size: 2 + Math.random() * 4,
    color:
      i % 3 === 0
        ? "rgba(139,92,246,0.4)"
        : i % 3 === 1
        ? "rgba(6,182,212,0.35)"
        : "rgba(99,102,241,0.3)",
  }));

  return (
    <div className="hero-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── MOCK DASHBOARD PREVIEW ────────────────── */
function DashboardPreview() {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - 0.78 * circumference; // 78% score

  return (
    <div className="preview-dashboard">
      {/* Top bar */}
      <div className="preview-topbar">
        <div className="preview-dot red" />
        <div className="preview-dot yellow" />
        <div className="preview-dot green" />
        <span className="preview-topbar-title">SecondBrain AI — Dashboard</span>
      </div>

      {/* Score Card */}
      <div className="preview-card">
        <h4>🎯 Life Score</h4>
        <div className="preview-score">
          <div className="preview-score-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="previewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#previewGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="preview-score-value">78</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "var(--text-dim)" }}>
            <span>✅ 14 Done</span>
            <span>⏳ 4 Pending</span>
            <span>🔥 5 Streak</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="preview-card">
        <h4>📋 Tasks</h4>
        {[
          { title: "Build landing page", done: true, pri: "high" },
          { title: "Deploy backend API", done: true, pri: "high" },
          { title: "Write documentation", done: false, pri: "medium" },
          { title: "Record demo video", done: false, pri: "low" },
        ].map((t, i) => (
          <div className="preview-task" key={i}>
            <div className={`preview-task-check ${t.done ? "done" : ""}`} />
            <span className={`preview-task-title ${t.done ? "done" : ""}`}>{t.title}</span>
            <span className={`preview-task-badge ${t.pri}`}>{t.pri}</span>
          </div>
        ))}
      </div>

      {/* AI Panel */}
      <div className="preview-card">
        <h4>🤖 AI Insights</h4>
        <div className="preview-ai-msg">
          <div className="preview-ai-label">⚡ Proactive Suggestion</div>
          Focus on "Write documentation" next — it's approaching deadline and your momentum is high today!
        </div>
        <div className="preview-ai-msg">
          <div className="preview-ai-label">🔮 Prediction</div>
          You're on track to complete 85% of tasks this week. Keep the streak going!
        </div>
        <div className="preview-ai-msg">
          <div className="preview-ai-label">🧠 Decision</div>
          Recommended: Start with documentation before the demo video for better flow.
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURES DATA ─────────────────────────── */
const features = [
  {
    icon: <Eye size={24} />,
    color: "purple",
    title: "Predictive Intelligence",
    desc: "Know what happens before it happens. AI analyzes your patterns and forecasts outcomes.",
  },
  {
    icon: <Target size={24} />,
    color: "cyan",
    title: "Smart Task Prioritization",
    desc: "AI decides what you should do next based on deadlines, effort, and your work style.",
  },
  {
    icon: <BarChart3 size={24} />,
    color: "blue",
    title: "Life Score Dashboard",
    desc: "Track productivity, consistency, and focus with a real-time score out of 100.",
  },
  {
    icon: <Zap size={24} />,
    color: "pink",
    title: "Proactive Suggestions",
    desc: "AI guides you without asking. Get alerts and advice the moment you open the app.",
  },
  {
    icon: <MessageCircle size={24} />,
    color: "indigo",
    title: "AI Chat Assistant",
    desc: "Talk to your personal intelligence layer. Share feelings, get emotional support & advice.",
  },
  {
    icon: <CalendarClock size={24} />,
    color: "green",
    title: "Auto Scheduling",
    desc: "Your day, perfectly planned by AI. Time-blocked schedules generated in seconds.",
  },
];

/* ─── STEPS DATA ────────────────────────────── */
const steps = [
  { num: 1, title: "Add Your Tasks", desc: "Drop in your goals, deadlines, and priorities" },
  { num: 2, title: "AI Analyzes", desc: "SecondBrain learns your patterns and behavior" },
  { num: 3, title: "Get Predictions", desc: "See forecasts, scores, and smart insights" },
  { num: 4, title: "Follow Decisions", desc: "Act on AI recommendations and crush your goals" },
];

/* ─── USP DATA ──────────────────────────────── */
const usps = [
  {
    icon: <Sparkles size={22} />,
    title: "Proactive, Not Reactive",
    desc: "Don't wait for problems. SecondBrain AI catches issues before they happen.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Predicts Outcomes",
    desc: "Goes beyond tracking. It predicts whether you'll succeed or fall behind.",
  },
  {
    icon: <Brain size={22} />,
    title: "Thinks Like a Real Brain",
    desc: "Combines urgency, priority, and behavioral data to make intelligent decisions.",
  },
  {
    icon: <Shield size={22} />,
    title: "Personalized Decisions",
    desc: "Every recommendation is tailored to your unique work style and goals.",
  },
];

/* ─── MAIN LANDING COMPONENT ────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ─── NAVBAR ─── */}
      <nav className="landing-nav">
        <div className="landing-container">
          <div className="nav-brand">
            <div className="nav-brand-icon">🧠</div>
            <span>SecondBrain AI</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#preview">Preview</a></li>
            <li><a href="#why-different">Why Us</a></li>
          </ul>
          <button className="nav-cta" onClick={() => navigate("/dashboard")}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <Particles />
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">✦ AI-POWERED PRODUCTIVITY</div>
              <h1>
                Your AI That<br />
                <span className="gradient-text">Thinks Ahead</span>
              </h1>
              <p className="hero-subtitle">
                SecondBrain AI predicts your future, organizes your tasks, and guides
                your decisions — before you even ask.
              </p>
              <div className="hero-buttons">
                <button className="btn-glow" onClick={() => navigate("/dashboard")}>
                  Get Started <ArrowRight size={18} />
                </button>
                <button className="btn-outline" onClick={() => {
                  document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  <Play size={18} /> Watch Demo
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrapper">
                <div className="hero-image-glow" />
                <img src="/ai-brain.png" alt="SecondBrain AI Neural Network" />
                <div className="orbit-ring" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-tag">✦ Features</div>
            <h2>Everything Your Brain Needs</h2>
            <p>Six powerful AI modules working together to optimize every aspect of your day.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feature-card reveal reveal-delay-${i + 1}`}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="landing-section" id="how-it-works" style={{ background: "rgba(10,10,26,0.5)" }}>
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-tag">✦ How It Works</div>
            <h2>Four Steps to a Smarter You</h2>
            <p>From tasks to intelligent action in under a minute.</p>
          </div>
          <div className="steps-timeline reveal">
            {steps.map((s) => (
              <div key={s.num} className="step-item">
                <div className="step-number">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT PREVIEW ─── */}
      <section className="landing-section" id="preview">
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-tag">✦ Product Preview</div>
            <h2>Your Digital Brain, Visualized</h2>
            <p>A glimpse into the dashboard that manages your entire life.</p>
          </div>
          <div className="preview-wrapper reveal">
            <div className="preview-glow" />
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ─── WHY DIFFERENT ─── */}
      <section className="landing-section" id="why-different" style={{ background: "rgba(10,10,26,0.5)" }}>
        <div className="landing-container">
          <div className="section-header reveal">
            <div className="section-tag">✦ Why SecondBrain</div>
            <h2>Not Just Another<br />Productivity App</h2>
            <p>We don't just track your tasks. We think for you.</p>
          </div>
          <div className="usp-grid">
            {usps.map((u, i) => (
              <div key={i} className={`usp-item reveal reveal-delay-${i + 1}`}>
                <div className="usp-icon">{u.icon}</div>
                <div>
                  <h4>{u.title}</h4>
                  <p>{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="landing-container">
          <h2 className="reveal">
            Stop Managing Tasks.<br />
            <span className="gradient-text">Start Thinking Smarter.</span>
          </h2>
          <p className="reveal reveal-delay-1">
            Join the future of productivity. Let AI handle the thinking while you focus on what matters.
          </p>
          <button
            className="btn-glow reveal reveal-delay-2"
            onClick={() => navigate("/dashboard")}
            style={{ fontSize: "1.05rem", padding: "16px 40px" }}
          >
            Start Using SecondBrain AI <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="nav-brand">
                <div className="nav-brand-icon">🧠</div>
                <span>SecondBrain AI</span>
              </div>
              <p>AI that predicts, decides, and guides your daily actions. Your digital brain for a smarter life.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h5>Product</h5>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#preview">Preview</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 SecondBrain AI. All rights reserved.</span>
            <div className="footer-socials">
              <a href="https://github.com/Shivanshu49" target="_blank" rel="noopener noreferrer" title="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" title="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" title="Email"><Mail size={16} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

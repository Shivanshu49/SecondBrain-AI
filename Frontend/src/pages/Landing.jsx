import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="brutalist">
      {/* ─── NAVBAR ─── */}
      <nav className="brutal-nav">
        <div className="brutal-nav-logo">
          <div className="brutal-nav-logo-box">⚡</div>
          SecondBrain AI
        </div>
        <ul className="brutal-nav-links">
          <li><a href="#" className="brutal-nav-link">Features</a></li>
          <li><a href="#" className="brutal-nav-link">About</a></li>
          <li>
            <button
              className="brutal-nav-link login-btn"
              onClick={() => navigate("/dashboard")}
            >
              Login →
            </button>
          </li>
        </ul>
      </nav>

      {/* ─── HERO ─── */}
      <section className="brutal-hero">
        {/* LEFT — TEXT */}
        <div className="brutal-hero-text">
          <div className="brutal-hero-tag">NOW IN BETA — v2.0</div>

          <h1 className="brutal-h1">
            STOP THINKING.<br />
            START{" "}
            <span className="highlight">WINNING.</span>
          </h1>

          <p className="brutal-subtitle">
            SecondBrain AI predicts your actions, prioritizes your tasks, and
            makes decisions before you do. It's not an app — it's your unfair
            advantage.
          </p>

          <div className="brutal-buttons">
            <button
              className="btn-brutal btn-brutal-primary"
              onClick={() => navigate("/dashboard")}
            >
              GET STARTED →
            </button>
            <button
              className="btn-brutal btn-brutal-outline"
              onClick={() => navigate("/dashboard")}
            >
              SEE DEMO ◆
            </button>
          </div>
        </div>

        {/* RIGHT — MOCK DASHBOARD */}
        <div className="brutal-hero-visual">
          <div className="brutal-dashboard">
            {/* Titlebar */}
            <div className="brutal-dash-titlebar">
              <div className="brutal-dash-dots">
                <div className="brutal-dash-dot red" />
                <div className="brutal-dash-dot yellow" />
                <div className="brutal-dash-dot green" />
              </div>
              <div className="brutal-dash-title">SecondBrain Dashboard</div>
            </div>

            {/* Body */}
            <div className="brutal-dash-body">
              {/* Score */}
              <div className="brutal-dash-score">
                <div className="brutal-dash-score-label">Productivity Score</div>
                <div className="brutal-dash-score-value">72%</div>
                <div className="brutal-dash-score-bar">
                  <div className="brutal-dash-score-fill" />
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="brutal-dash-ai">
                <div className="brutal-dash-ai-label">⚡ AI Says</div>
                <div className="brutal-dash-ai-text">
                  "Do DSA now.<br />
                  Deadline tomorrow."
                </div>
                <div className="brutal-dash-ai-small">
                  Based on your behavior pattern
                </div>
              </div>

              {/* Tasks */}
              <div className="brutal-dash-tasks">
                <div className="brutal-dash-tasks-header">Today's Tasks</div>
                <div className="brutal-dash-task">
                  <div className="brutal-task-check done">✓</div>
                  <span className="brutal-task-name done">Push code to GitHub</span>
                  <span className="brutal-task-tag normal">Done</span>
                </div>
                <div className="brutal-dash-task">
                  <div className="brutal-task-check done">✓</div>
                  <span className="brutal-task-name done">Build landing page</span>
                  <span className="brutal-task-tag normal">Done</span>
                </div>
                <div className="brutal-dash-task">
                  <div className="brutal-task-check" />
                  <span className="brutal-task-name">Solve 3 DSA problems</span>
                  <span className="brutal-task-tag urgent">Urgent</span>
                </div>
                <div className="brutal-dash-task">
                  <div className="brutal-task-check" />
                  <span className="brutal-task-name">Record demo video</span>
                  <span className="brutal-task-tag high">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FLOATING STICKERS ─── */}
        <div className="brutal-sticker sticker-1">AI INSIDE</div>
        <div className="brutal-sticker sticker-2">SMART &gt; HARD</div>
        <div className="brutal-sticker sticker-3">NO EXCUSES</div>
        <div className="brutal-sticker sticker-4">◆ BUILT DIFFERENT</div>

        {/* ─── FLOATING SHAPES ─── */}
        <div className="brutal-shape shape-square-1" />
        <div className="brutal-shape shape-square-2" />
        <div className="brutal-shape shape-rect" />
        <div className="brutal-shape shape-arrow">→</div>
      </section>

      {/* ─── BOTTOM BAR ─── */}
      <div className="brutal-bottom-bar">
        <span>© 2026 SecondBrain AI</span>
        <div className="brutal-bottom-bar-links">
          <a href="https://github.com/Shivanshu49" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#">Twitter</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
}

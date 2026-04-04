import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle,
  Clock,
  Flame,
  Target,
} from "lucide-react";
import { fetchScore, fetchAlerts, fetchProactive } from "../api";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function ScoreRing({ score }) {
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring-container">
      <div className="score-ring">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle className="score-ring-bg" cx="90" cy="90" r={radius} />
          <circle
            className="score-ring-fill"
            cx="90"
            cy="90"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-ring-text">
          <div className="score-value">{score}</div>
          <div className="score-label">Score</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [score, setScore] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [proactive, setProactive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [scoreData, alertData, proactiveData] = await Promise.all([
        fetchScore(),
        fetchAlerts(),
        fetchProactive(),
      ]);
      setScore(scoreData);
      setAlerts(alertData);
      setProactive(proactiveData);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>🧠 Dashboard</h2>
        <p>Your AI-powered productivity overview</p>
      </div>

      {/* Proactive AI Suggestion */}
      {proactive && (
        <motion.div
          className="proactive-card"
          style={{ marginBottom: 24 }}
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="ai-message-header">
            <Zap size={16} /> SecondBrain AI
          </div>
          <div className="ai-message-content">{proactive.message}</div>
        </motion.div>
      )}

      <div className="card-grid">
        {/* Score Card */}
        <motion.div className="card" custom={1} initial="hidden" animate="visible" variants={fadeIn}>
          <div className="card-header">
            <h3><Activity size={18} /> Life Score</h3>
          </div>
          {score && (
            <>
              <ScoreRing score={score.score} />
              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-value green">{score.completed_tasks}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value amber">{score.pending_tasks}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value cyan">{score.streak}</div>
                  <div className="stat-label">Streak 🔥</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value red">{score.missed_tasks}</div>
                  <div className="stat-label">Missed</div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Quick Stats Card */}
        <motion.div className="card" custom={2} initial="hidden" animate="visible" variants={fadeIn}>
          <div className="card-header">
            <h3><Target size={18} /> Quick Stats</h3>
          </div>
          {score && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} /> Completion Rate
                </span>
                <span style={{ fontWeight: 700, color: score.completion_rate >= 60 ? "var(--accent-green)" : "var(--accent-amber)" }}>
                  {score.completion_rate}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Flame size={16} /> Consistency
                </span>
                <span style={{ fontWeight: 700, color: "var(--accent-violet)" }}>
                  {score.consistency_score}/100
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={16} /> Total Tasks
                </span>
                <span style={{ fontWeight: 700 }}>{score.total_tasks}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Alerts */}
      {alerts && alerts.has_alerts && (
        <motion.div className="card" style={{ marginTop: 20 }} custom={3} initial="hidden" animate="visible" variants={fadeIn}>
          <div className="card-header">
            <h3><AlertTriangle size={18} /> Alerts</h3>
          </div>
          {alerts.alerts.map((alert, i) => (
            <div key={i} className={`alert-banner ${alert.severity}`}>
              {alert.message}
            </div>
          ))}
          {alerts.ai_summary && (
            <div className="ai-message" style={{ marginTop: 12 }}>
              <div className="ai-message-header">
                <Zap size={14} /> AI Analysis
              </div>
              <div className="ai-message-content">{alerts.ai_summary}</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

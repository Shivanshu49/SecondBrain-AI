import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, RefreshCw, Clock, Zap } from "lucide-react";
import { fetchSchedule } from "../api";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function Schedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState(8);

  async function loadSchedule() {
    setLoading(true);
    try {
      const data = await fetchSchedule(hours);
      setSchedule(data);
    } catch (err) {
      console.error("Failed to load schedule:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>📅 Schedule</h2>
        <p>AI-generated daily plan based on your tasks and priorities</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ minWidth: 140, flex: "unset" }}>
            <label>Available Hours</label>
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {[4, 5, 6, 7, 8, 9, 10, 12].map((h) => (
                <option key={h} value={h}>{h} hours</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadSchedule} disabled={loading}>
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
            ) : (
              <><Calendar size={16} /> Generate Today's Plan</>
            )}
          </button>
        </div>
      </div>

      {/* Schedule Display */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      )}

      {!loading && !schedule && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>Click "Generate Today's Plan" to create your AI-powered schedule</p>
        </div>
      )}

      {schedule && schedule.schedule && schedule.schedule.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="timeline">
            {schedule.schedule.map((slot, i) => (
              <motion.div
                key={i}
                className="timeline-slot"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <div className="timeline-time">
                  <Clock size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  {slot.time}
                </div>
                <div className="timeline-line" />
                <div className="timeline-content">
                  <div className="task-name">{slot.task}</div>
                  {slot.priority && (
                    <span className={`priority-badge ${slot.priority}`} style={{ marginTop: 4, display: "inline-block" }}>
                      {slot.priority}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {schedule && schedule.schedule && schedule.schedule.length === 0 && schedule.ai_notes && (
        <div className="ai-message">
          <div className="ai-message-header">
            <Zap size={14} /> AI Schedule Notes
          </div>
          <div className="ai-message-content">{schedule.ai_notes}</div>
        </div>
      )}

      {schedule && schedule.ai_notes && schedule.schedule && schedule.schedule.length > 0 && (
        <div className="ai-message" style={{ marginTop: 20 }}>
          <div className="ai-message-header">
            <Zap size={14} /> AI Notes
          </div>
          <div className="ai-message-content">{schedule.ai_notes}</div>
        </div>
      )}
    </div>
  );
}

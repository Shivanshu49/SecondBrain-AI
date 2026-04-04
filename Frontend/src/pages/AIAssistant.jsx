import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Target,
  MessageCircle,
  Send,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  fetchDecision,
  fetchPrediction,
  analyzeMentalState,
  fetchSuggestions,
} from "../api";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function AIAssistant() {
  const [decision, setDecision] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Chat / Mental State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function loadDecision() {
    setDecisionLoading(true);
    try {
      const data = await fetchDecision();
      setDecision(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDecisionLoading(false);
    }
  }

  async function loadPrediction() {
    setPredictionLoading(true);
    try {
      const data = await fetchPrediction();
      setPrediction(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPredictionLoading(false);
    }
  }

  async function handleChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await analyzeMentalState(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.ai_response,
          emotion: data.emotion,
          intensity: data.intensity,
          suggestion: data.suggestion,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>🤖 AI Assistant</h2>
        <p>Get AI-powered decisions, predictions, and mental wellness support</p>
      </div>

      <div className="card-grid">
        {/* Decision Engine */}
        <motion.div className="card" custom={0} initial="hidden" animate="visible" variants={fadeIn}>
          <div className="card-header">
            <h3><Target size={18} /> Decision Engine</h3>
            <button
              className="btn btn-secondary"
              onClick={loadDecision}
              disabled={decisionLoading}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              {decisionLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Zap size={14} /> Decide</>}
            </button>
          </div>

          {!decision && !decisionLoading && (
            <div className="empty-state" style={{ padding: 30 }}>
              <p style={{ color: "var(--text-muted)" }}>Click "Decide" to get your recommended task</p>
            </div>
          )}

          {decision && (
            <div>
              {decision.selected_task ? (
                <>
                  <div style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    marginBottom: 12,
                  }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--accent-violet)", marginBottom: 4, fontWeight: 600 }}>
                      ✨ DO THIS FIRST
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{decision.selected_task}</div>
                  </div>
                  <div className="ai-message-content" style={{ fontSize: "0.85rem" }}>{decision.reason}</div>
                  {decision.alternatives.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Also consider: {decision.alternatives.join(", ")}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>{decision.reason}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Prediction Engine */}
        <motion.div className="card" custom={1} initial="hidden" animate="visible" variants={fadeIn}>
          <div className="card-header">
            <h3><TrendingUp size={18} /> Life Prediction</h3>
            <button
              className="btn btn-secondary"
              onClick={loadPrediction}
              disabled={predictionLoading}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              {predictionLoading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Brain size={14} /> Predict</>}
            </button>
          </div>

          {!prediction && !predictionLoading && (
            <div className="empty-state" style={{ padding: 30 }}>
              <p style={{ color: "var(--text-muted)" }}>Click "Predict" to see your future outlook</p>
            </div>
          )}

          {prediction && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <span className={`prediction-badge ${prediction.prediction}`}>
                  {prediction.prediction === "success" ? "✅" : prediction.prediction === "failure" ? "❌" : "⚠️"}
                  {prediction.prediction}
                </span>
                <span className="prediction-badge" style={{
                  background: "rgba(34, 211, 238, 0.1)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(34, 211, 238, 0.3)"
                }}>
                  Confidence: {prediction.confidence}
                </span>
              </div>

              <div className="ai-message-content" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
                {prediction.summary}
              </div>

              {prediction.suggestions.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-cyan)", marginBottom: 8 }}>
                    💡 Suggestions
                  </div>
                  <ul className="suggestion-list">
                    {prediction.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mental State Chat */}
      <motion.div className="card" style={{ marginTop: 20 }} custom={2} initial="hidden" animate="visible" variants={fadeIn}>
        <div className="card-header">
          <h3><MessageCircle size={18} /> Mental Wellness Chat</h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
          Share how you're feeling. SecondBrain AI will detect your emotion and provide supportive guidance.
        </p>

        <div className="chat-container">
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: "0.88rem" }}>
              💬 Start a conversation...
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
              {msg.role === "ai" && msg.emotion && (
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="emotion-badge">
                    {msg.emotion}
                  </span>
                  {msg.suggestion && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", alignSelf: "center" }}>
                      💡 {msg.suggestion}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="chat-bubble ai" style={{ display: "flex", gap: 4 }}>
              <span>●</span><span style={{ animationDelay: "0.2s" }}>●</span><span style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          )}
        </div>

        <form className="chat-input-row" onSubmit={handleChat}>
          <textarea
            placeholder="How are you feeling today?"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleChat(e);
              }
            }}
            rows={2}
            disabled={chatLoading}
          />
          <button className="btn btn-primary" type="submit" disabled={chatLoading || !chatInput.trim()}>
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

import { useState } from 'react'
import '../styles/feedback.css'

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('bug') // bug | feedback | contact
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, send to backend. For hackathon, just show success.
    console.log(`[${type.toUpperCase()}] ${message}`)
    setSubmitted(true)
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setMessage('')
    }, 2000)
  }

  if (!open) {
    return (
      <button
        className="feedback-fab"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Report bug or send feedback"
      >
        💬
      </button>
    )
  }

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <span className="feedback-header-title">FEEDBACK</span>
        <button className="feedback-close" onClick={() => setOpen(false)}>✕</button>
      </div>

      {submitted ? (
        <div className="feedback-success">
          ✅ Thank you! We received your message.
        </div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-types">
            {[
              { key: 'bug', label: '🐛 Bug', },
              { key: 'feedback', label: '💡 Feedback' },
              { key: 'contact', label: '✉️ Contact' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`feedback-type ${type === t.key ? 'feedback-type--active' : ''}`}
                onClick={() => setType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            className="feedback-textarea"
            placeholder={
              type === 'bug'
                ? 'Describe the bug — what happened and what you expected…'
                : type === 'contact'
                  ? 'How can we help you?'
                  : 'Share your thoughts or suggestions…'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
          />
          <button type="submit" className="feedback-submit" disabled={!message.trim()}>
            SEND →
          </button>
        </form>
      )}
    </div>
  )
}

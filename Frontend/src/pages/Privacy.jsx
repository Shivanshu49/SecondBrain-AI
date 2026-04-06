import { Link } from 'react-router-dom'
import '../styles/legal.css'

export default function Privacy() {
  return (
    <main className="legal-page">
      <div className="legal-card">
        <h1 className="legal-title">PRIVACY POLICY</h1>
        <p className="legal-updated">Last updated: April 2026</p>

        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>When you use SecondBrain AI, we collect the following information:</p>
          <ul>
            <li><strong>Account Data:</strong> Name, email address, and encrypted password when you create an account.</li>
            <li><strong>Task Data:</strong> Tasks, deadlines, priorities, and completion status you create within the app.</li>
            <li><strong>AI Interaction Data:</strong> Text inputs you provide to our AI features (predictions, mental state analysis, scheduling) are processed in real-time and not permanently stored beyond your session.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>To provide task management and AI-powered productivity features</li>
            <li>To generate personalized predictions, schedules, and recommendations</li>
            <li>To calculate your productivity score and streak</li>
            <li>To improve our AI models and service quality</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Google Gemini API:</strong> For AI-powered text generation and analysis. Your prompts are sent to Google's servers for processing. See <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer">Google's AI Terms</a>.</li>
            <li><strong>MongoDB:</strong> For secure database storage of your tasks and account data.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures including:</p>
          <ul>
            <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
            <li>Authentication via JWT tokens with expiration</li>
            <li>HTTPS encryption for data in transit</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Retention</h2>
          <p>Your data is retained as long as your account is active. You can request deletion of your account and all associated data by contacting us.</p>
        </section>

        <section className="legal-section">
          <h2>6. Contact</h2>
          <p>For privacy-related questions, contact us at: <strong>eternityx.team@gmail.com</strong></p>
        </section>

        <div className="legal-footer-links">
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </main>
  )
}

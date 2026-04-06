import { Link } from 'react-router-dom'
import '../styles/legal.css'

export default function Terms() {
  return (
    <main className="legal-page">
      <div className="legal-card">
        <h1 className="legal-title">TERMS & CONDITIONS</h1>
        <p className="legal-updated">Last updated: April 2026</p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using SecondBrain AI, you agree to be bound by these Terms & Conditions. If you do not agree, do not use the service.</p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>SecondBrain AI is an AI-powered productivity platform that provides:</p>
          <ul>
            <li>Task management (create, edit, delete, complete tasks)</li>
            <li>AI-powered predictions, scheduling, and prioritization</li>
            <li>Productivity scoring and failure alerts</li>
            <li>Mental state analysis and wellness suggestions</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <ul>
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 13 years of age to use this service.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Attempt to exploit, hack, or disrupt the service</li>
            <li>Upload harmful, offensive, or inappropriate content</li>
            <li>Share your account with unauthorized users</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. AI Disclaimer</h2>
          <p>SecondBrain AI uses artificial intelligence (Google Gemini) to generate predictions, suggestions, and schedules. These outputs are:</p>
          <ul>
            <li><strong>Not guaranteed to be accurate</strong> — AI predictions are estimates, not certainties.</li>
            <li><strong>Not professional advice</strong> — mental state analysis is not a substitute for professional mental health care.</li>
            <li><strong>Generated in real-time</strong> — results may vary between sessions.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>SecondBrain AI is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of this service, including but not limited to missed deadlines, lost data, or inaccurate AI predictions.</p>
        </section>

        <section className="legal-section">
          <h2>7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
        </section>

        <section className="legal-section">
          <h2>8. Contact</h2>
          <p>Questions about these terms? Contact us at: <strong>eternityx.team@gmail.com</strong></p>
        </section>

        <div className="legal-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </main>
  )
}

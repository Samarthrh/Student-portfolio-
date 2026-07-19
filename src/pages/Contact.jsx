import { useState } from 'react';

function Contact() {
  const [message, setMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main className="page">
      <section className="contact-card">
        <div className="section-header">
          <p className="eyebrow">Let’s connect</p>
          <h1>Share a thought or project idea.</h1>
        </div>

        <div className="contact-form">
          <button onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
          {showHelp && <p className="help-text">Type your message below — it updates live.</p>}

          <label className="field">
            <span>Your message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me about your idea..."
            />
          </label>
          <p className="counter">{message.length} characters</p>
        </div>
      </section>
    </main>
  );
}

export default Contact;
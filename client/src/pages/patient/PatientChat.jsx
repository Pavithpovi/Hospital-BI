import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { chatAPI } from '../../api/api';

export default function PatientChat() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! 👋 I'm the Hospital BI Assistant, your health assistant.\n\nI can help you with:\n• General health questions\n• Understanding symptoms\n• Wellness tips & prevention\n• Navigating the hospital\n\nHow can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await chatAPI.send(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "I'm sorry, I couldn't process that right now. Please try again later or consult your doctor. 🏥"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What should I do for a headache?",
    "How can I improve my sleep?",
    "Tips for staying hydrated",
    "How to book an appointment?",
    "What is a normal blood pressure?",
  ];

  return (
    <div>
      <div className="page-title">
        <h2>🤖 AI Health Assistant</h2>
        <p>Chat with the Hospital BI Assistant about your health concerns</p>
      </div>

      <motion.div
        className="glass-card-static"
        style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Chat Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            🤖
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Hospital BI Assistant</h3>
            <p style={{ fontSize: '12px', color: '#10b981' }}>● Online — Health Assistant</p>
          </div>
          <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(6,182,212,0.1)', borderRadius: '20px', fontSize: '11px', color: '#67e8f9' }}>
            AI Powered
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: msg.role === 'bot' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                background: msg.role === 'bot' ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.15)',
                border: `1px solid ${msg.role === 'bot' ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.2)'}`,
                alignSelf: msg.role === 'bot' ? 'flex-start' : 'flex-end',
                fontSize: '14px',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}
            >
              {msg.text}
            </motion.div>
          ))}
          {loading && (
            <div style={{ padding: '12px 16px', background: 'rgba(6,182,212,0.06)', borderRadius: '16px', alignSelf: 'flex-start', maxWidth: '80%' }}>
              <span style={{ animation: 'pulse 1s infinite', color: '#67e8f9' }}>🤖 Thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px' }}
                onClick={() => { setInput(q); }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask about your health..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            Send ➤
          </button>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
          ⚠️ The Hospital BI Assistant provides general health information only. Always consult your doctor for medical advice.
        </p>
      </motion.div>
    </div>
  );
}

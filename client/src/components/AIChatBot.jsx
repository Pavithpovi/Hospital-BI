import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../api/api';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! 👋 I'm the Hospital BI Assistant. Ask me anything about general health, symptoms, or navigating the hospital. How can I help you today?" }
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
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I couldn't process that right now. Please try again or consult your doctor for medical advice. 🏥" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      <button className="chatbot-toggle no-print" onClick={() => setIsOpen(!isOpen)} title="AI Health Chat">
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="bot-avatar">🤖</div>
            <div>
              <h4>Hospital BI Assistant</h4>
              <p>● Online — Health Assistant</p>
            </div>
          </div>

          <div className="chatbot-messages" ref={messagesRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chat-message bot" style={{ opacity: 0.6 }}>
                <span style={{ animation: 'pulse 1s infinite' }}>Thinking...</span>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

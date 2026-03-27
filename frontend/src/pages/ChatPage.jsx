import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { sendMessage } from '../services/api'; // We'll build the mock API next

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! 🙏 I am PolicyGPT Bharat, your AI Government Scheme Advisor. Tell me a bit about yourself (e.g., "I am a 30-year-old farmer from Maharashtra") and I will find the best schemes for you!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Send to backend (mocked for now)
      const response = await sendMessage(text, {}); // Will integrate profile later
      
      const aiMsg = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: response.text,
        schemes: response.schemes, 
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I am having trouble connecting to the server. Please check your connection.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10 w-full max-w-4xl mx-auto glass-panel border-r border-slate-700/50 shadow-2xl bg-surface/80 backdrop-blur-3xl animate-fade-in relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 glass z-20 sticky top-0">
        <h2 className="text-xl font-display font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          AI Assistant Active
        </h2>
        <p className="text-sm text-slate-400">Ask me anything about govt schemes</p>
      </div>

      {/* Messages Array */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-sm p-4 max-w-[75%] glass-card flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 w-full" />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-700/50 glass z-20">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}

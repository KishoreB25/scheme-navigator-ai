import { useRef, useEffect } from 'react';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import useChat from '../hooks/useChat';
import useProfile from '../hooks/useProfile';
import { Sparkles, Trash2, HelpCircle } from 'lucide-react';

export default function ChatPage() {
  const { messages, isLoading, sendQuery, clearHistory } = useChat();
  const { profile } = useProfile();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (text) => {
    // Passes the actual profile state from useProfile hook, fixing backend filtration
    sendQuery(text, profile);
  };

  // Static welcome message shown when there is no chat history
  const welcomeMessage = {
    id: 'welcome',
    sender: 'assistant',
    content: `Namaste! 🙏 I am PolicySetu AI, your personal Government Scheme & Citizen Services Advisor.\n\nTo find the most suitable schemes for you, please fill out your profile in the **User Profile** section so I can instantly check your eligibility.\n\nHow can I help you today? (e.g., "What schemes are available for a farmer in Gujarat?")`,
  };

  return (
    <div className="h-full flex flex-col relative z-10 w-full max-w-4xl mx-auto bg-surface/10 border border-border/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in my-0">
      {/* Header Banner */}
      <div className="p-5 border-b border-border/80 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent z-25 sticky top-0 backdrop-blur-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow animate-pulse"></div>
          <div>
            <h2 className="text-base font-bold font-display tracking-wider text-white flex items-center gap-1.5 leading-tight">
              PolicySetu Active Advisor <Sparkles className="w-3.5 h-3.5 text-primary" />
            </h2>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              {profile.username ? `Assisting ${profile.username}` : 'Ask anything about central & state govt schemes'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-2 rounded-xl border border-border hover:border-red-500/25 bg-slate-950/45 hover:bg-red-500/10 transition-all cursor-pointer select-none duration-200"
            title="Clear Chat History"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar scroll-smooth bg-transparent">
        {messages.length === 0 ? (
          <ChatBubble message={welcomeMessage} />
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}
        
        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-surface/35 backdrop-blur-md border border-border/70 rounded-2xl rounded-tl-sm p-4.5 max-w-[75%] shadow-md flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0.15s' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 w-full" />
      </div>

      {/* floating helper cards (only shown when conversation has not started) */}
      {messages.length === 0 && (
        <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1.5 select-none opacity-85">
          <button 
            onClick={() => handleSend("What schemes can help me start a business?")}
            className="text-left p-3.5 rounded-xl border border-border bg-slate-950/20 hover:bg-primary/5 hover:border-primary/20 text-xs text-slate-400 hover:text-primary transition-all duration-200 cursor-pointer"
          >
            💡 <span className="font-semibold text-slate-300">Entrepreneurship:</span> "What schemes can help me start a business?"
          </button>
          <button 
            onClick={() => handleSend(`Show me eligible schemes for a ${profile.occupation || 'farmer'} from ${profile.state || 'Maharashtra'}`)}
            className="text-left p-3.5 rounded-xl border border-border bg-slate-950/20 hover:bg-primary/5 hover:border-primary/20 text-xs text-slate-400 hover:text-primary transition-all duration-200 cursor-pointer"
          >
            🌾 <span className="font-semibold text-slate-300">Profile Match:</span> "Show schemes for a {profile.occupation || 'farmer'} in {profile.state || 'Maharashtra'}"
          </button>
        </div>
      )}

      {/* Input Form Area */}
      <div className="p-6 border-t border-border/80 bg-surface/20 rounded-b-2xl z-20 backdrop-blur-md">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}

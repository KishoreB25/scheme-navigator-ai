import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBubble from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import useChat from '../hooks/useChat';
import useProfile from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { Sparkles, Trash2, ShieldCheck, Database, Sliders, ArrowRight, Info, IndianRupee, MapPin, Briefcase, Calendar, LogOut } from 'lucide-react';

export default function ChatPage() {
  const { messages, isLoading, sendQuery, clearHistory } = useChat();
  const { profile, isComplete } = useProfile();
  const { user, logout } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (text) => {
    sendQuery(text, profile);
  };

  const welcomeMessage = {
    id: 'welcome',
    sender: 'assistant',
    content: `Namaste! 🙏 I am PolicySetu AI, your personal Government Scheme & Citizen Services Advisor.\n\nTo find the most suitable schemes for you, please fill out your profile in the **User Profile** section so I can instantly check your eligibility.\n\nHow can I help you today? (e.g., "What schemes are available for a farmer in Gujarat?")`,
  };

  // Only show profile data if user is logged in
  const hasProfileData = user && (profile.age || profile.state || profile.occupation || profile.income);

  return (
    <div className="h-full w-full p-6 bg-transparent flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto overflow-hidden">
      
      {/* Left Panel: Conversational Workspace */}
      <div className="flex-1 h-full flex flex-col relative bg-surface/10 border border-border/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-border/80 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent z-20 sticky top-0 backdrop-blur-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow animate-pulse"></div>
            <div>
              <h2 className="text-base font-bold font-display tracking-wider text-white flex items-center gap-1.5 leading-tight">
                PolicySetu AI Assistant <Sparkles className="w-3.5 h-3.5 text-primary" />
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

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar scroll-smooth bg-transparent">
          {messages.length === 0 ? (
            <ChatBubble message={welcomeMessage} />
          ) : (
            messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
          )}
          
          {isLoading && (
            <div className="flex justify-start animate-slide-up">
              <div className="bg-surface/35 backdrop-blur-md border border-border/70 rounded-2xl rounded-tl-sm p-4.5 max-w-[75%] shadow-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0s' }}></span>
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-glow" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4 w-full" />
        </div>

        {/* Floating Quick Suggestion Cards */}
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

        {/* Input Bar */}
        <div className="p-6 border-t border-border/80 bg-surface/20 rounded-b-2xl z-20 backdrop-blur-md">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>

      {/* Right Panel: Active Metadata & Quick Drawer (Visible on large screens) */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-surface/10 border border-border/80 backdrop-blur-xl rounded-2xl p-5 space-y-6 overflow-y-auto custom-scrollbar shadow-2xl animate-fade-in">
        
        {/* Active Profile Header */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 border-b border-border/80 pb-2 select-none">
            <Sliders className="w-4 h-4 text-primary" /> Active Search Filters
          </h3>

          {user && (
            <div className="bg-slate-950/40 border border-border/60 rounded-xl p-4 space-y-3 mb-3">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover border border-primary/30"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    user.picture ? 'hidden' : ''
                  }`}
                  style={user.picture ? { display: 'none' } : { display: 'flex' }}
                >
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-[10px] font-bold rounded-lg transition border border-slate-700 hover:border-red-500/30 cursor-pointer"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          )}

          {hasProfileData ? (
            <div className="bg-slate-950/40 border border-border/60 rounded-xl p-4.5 space-y-3 shadow-inner">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                Current Persona: <span className="text-white">{profile.username || 'Citizen'}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1.5">
                {profile.state && (
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <MapPin size={10} /> {profile.state}
                  </span>
                )}
                {profile.occupation && (
                  <span className="text-[10px] bg-accent/10 text-accent border border-accent/25 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Briefcase size={10} /> {profile.occupation}
                  </span>
                )}
                {profile.age && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Calendar size={10} /> {profile.age} Yrs
                  </span>
                )}
                {profile.income && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <IndianRupee size={10} /> {profile.income.toLocaleString('en-IN')}/Yr
                  </span>
                )}
              </div>

              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-1.5 w-full mt-3 px-3 py-2 bg-primary hover:bg-secondary text-slate-950 text-[10px] font-bold rounded-lg transition active:scale-95 shadow-glow shadow-primary/10 cursor-pointer"
              >
                Configure Filters <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-border/60 rounded-xl p-4.5 text-center space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                No search profile filters are active. AI eligibility evaluation is limited.
              </p>
              
              {!user ? (
                <>
                  <GoogleLoginButton />
                  <p className="text-[10px] text-slate-500">or</p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center gap-1 w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition active:scale-95 cursor-pointer border border-slate-600"
                  >
                    Create Profile <ArrowRight size={12} />
                  </Link>
                </>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center gap-1 w-full px-3 py-2 bg-primary hover:bg-secondary text-slate-950 text-[10px] font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-glow shadow-primary/10"
                >
                  Update Profile <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* System Health / Status Badges */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center gap-2 border-b border-border/80 pb-2 select-none">
            <Database className="w-4 h-4 text-accent" /> System Pipeline
          </h3>

          <div className="space-y-2">
            <div className="bg-slate-950/30 border border-border/40 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database size={12} className="text-primary" /> RAG Knowledge Base
              </span>
              <span className="text-[10px] bg-eligible/10 border border-eligible/20 text-eligible font-semibold px-2 py-0.5 rounded">
                Synced (ChromaDB)
              </span>
            </div>

            <div className="bg-slate-950/30 border border-border/40 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-accent" /> LLM Guardrails
              </span>
              <span className="text-[10px] bg-eligible/10 border border-eligible/20 text-eligible font-semibold px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-slate-950/20 border border-border/40 p-4 rounded-xl space-y-2 pt-3 select-none">
          <p className="text-[11px] font-semibold text-slate-350 uppercase tracking-wider flex items-center gap-1">
            <Info size={12} className="text-primary" /> Search Guidelines
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            PolicySetu uses hybrid ChromaDB semantic embeddings + structured filters to check eligibility in real-time. Ask questions using natural citizen phrasing.
          </p>
        </div>

      </aside>
    </div>
  );
}

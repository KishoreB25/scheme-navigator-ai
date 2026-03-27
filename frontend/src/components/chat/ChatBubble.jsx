import SchemeCard from '../schemes/SchemeCard';
import { User } from 'lucide-react';

export default function ChatBubble({ message }) {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} animate-slide-up`}>
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-3 group px-5 py-4 ${
          isAI
            ? 'glass-card text-slate-200 border-slate-700/50 rounded-tl-sm'
            : 'bg-primary text-white shadow-glow shadow-primary/20 rounded-2xl rounded-tr-sm'
        }`}
      >
        {isAI && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-glass">
            AI
          </div>
        )}

        <div className="flex-1 space-y-3">
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.text}
          </div>

          {/* Render Schemes if provided by AI */}
          {message.schemes && message.schemes.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {message.schemes.map((scheme, idx) => (
                <SchemeCard key={idx} scheme={scheme} />
              ))}
            </div>
          )}
        </div>

        {!isAI && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
            <User size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

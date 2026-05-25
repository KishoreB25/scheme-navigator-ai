import SchemeCard from '../schemes/SchemeCard';
import { User } from 'lucide-react';

export default function ChatBubble({ message }) {
  const isAI = message.sender === 'ai' || message.sender === 'assistant';
  const textContent = message.content || message.text;

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} animate-slide-up`}>
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-2 group p-2 rounded-2xl border ${isAI
          ? 'bg-surface/40 backdrop-blur-md text-slate-100 border-border/70 rounded-tl-sm shadow-md'
          : 'bg-accent text-white border-accent/20 rounded-tr-sm shadow-glow-purple shadow-accent/10'
          }`}
      >
        {isAI && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-primary shadow-glow select-none">
            PS
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-sans tracking-wide">
            {textContent}
          </div>

          {/* Render Schemes if provided by AI */}
          {message.schemes && message.schemes.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold font-sans mb-1">
                Recommended Schemes for You:
              </p>
              {message.schemes.map((scheme, idx) => (
                <SchemeCard key={idx} scheme={scheme} />
              ))}
            </div>
          )}
        </div>

        {!isAI && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-glow-purple select-none">
            <User size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

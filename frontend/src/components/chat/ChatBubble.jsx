import SchemeCard from '../schemes/SchemeCard';
import { User, ExternalLink } from 'lucide-react';
import VoiceOutputButton from './VoiceOutputButton';

/**
 * Parse citation markers [Source: url] into structured objects
 */
function parseCitations(text) {
  if (!text) return { cleanText: text, citations: [] };

  const citationRegex = /\[Source:\s*(https?:\/\/[^\]]+)\]/gi;
  const citations = [];
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const url = match[1].trim();
    if (!citations.some(c => c.url === url)) {
      citations.push({ url, domain: new URL(url).hostname.replace('www.', '') });
    }
  }

  // Remove citation markers from display text
  const cleanText = text.replace(citationRegex, '').replace(/\s{2,}/g, ' ').trim();
  return { cleanText, citations };
}

/**
 * Render markdown-lite text (bold, bullets, line breaks)
 */
function renderMarkdown(text) {
  if (!text) return null;

  return text.split('\n').map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet points
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      return (
        <div key={i} className="pl-3 py-0.5 flex items-start gap-1.5">
          <span className="text-primary mt-0.5 shrink-0">•</span>
          <span>{parts}</span>
        </div>
      );
    }

    // Empty line = paragraph break
    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }

    return <div key={i} className="py-0.5">{parts}</div>;
  });
}

export default function ChatBubble({ message }) {
  const isAI = message.sender === 'ai' || message.sender === 'assistant';
  const textContent = message.content || message.text;
  const isConversational = message.response_type === 'conversational';

  // Parse citations from LLM text
  const { cleanText, citations } = isAI
    ? parseCitations(textContent)
    : { cleanText: textContent, citations: [] };

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
          {/* Rendered message text with markdown support */}
          <div className="flex gap-4 relative group/text">
            <div className="text-[14.5px] leading-relaxed font-sans tracking-wide flex-1">
              {isAI ? renderMarkdown(cleanText) : cleanText}
            </div>
            {isAI && (
              <div className="shrink-0 opacity-0 group-hover/text:opacity-100 transition-opacity">
                <VoiceOutputButton text={cleanText} />
              </div>
            )}
          </div>

          {/* Citations footer (only for AI messages with sources) */}
          {isAI && citations.length > 0 && (
            <div className="border-t border-border/50 pt-2 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                Sources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {citations.map((cite, idx) => (
                  <a
                    key={idx}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink size={9} />
                    {cite.domain}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Render Scheme cards (only for scheme-type responses) */}
          {!isConversational && message.schemes && message.schemes.length > 0 && (
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

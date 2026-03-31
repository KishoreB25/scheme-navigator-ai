import { Send, Mic, Square } from 'lucide-react';
import { useState } from 'react';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
    setText((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
  });

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="flex items-center bg-slate-950/45 backdrop-blur-md px-4 py-2 rounded-2xl border border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 shadow-lg transition-all duration-300">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-3 rounded-xl transition-all border shrink-0 cursor-pointer ${
          isListening
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse-dot'
            : 'text-slate-400 border-transparent hover:text-primary hover:bg-primary/10'
        }`}
        title="Voice Input"
      >
        {isListening ? <Square className="w-4 h-4 fill-current animate-spin" style={{ animationDuration: '3s' }} /> : <Mic className="w-4 h-4" />}
      </button>

      <textarea
        className="flex-1 bg-transparent border-0 text-slate-100 placeholder:text-slate-500 py-3.5 px-3 outline-none resize-none custom-scrollbar font-sans text-sm leading-relaxed"
        placeholder="Type your query here or use voice input..."
        value={text}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={`p-3 rounded-xl transition-all duration-200 border shrink-0 cursor-pointer ${
          disabled || !text.trim()
            ? 'opacity-30 border-transparent text-slate-600 cursor-not-allowed bg-slate-900'
            : 'bg-primary border-primary/20 text-slate-950 hover:bg-secondary shadow-glow shadow-primary/15 hover:shadow-primary/25 active:scale-95'
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

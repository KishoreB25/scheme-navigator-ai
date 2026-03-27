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
    <div className="flex bg-slate-800/60 p-2 rounded-2xl glass shadow-indigo-500/10 border border-slate-700/50">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-3 rounded-xl transition shrink-0 ${
          isListening
            ? 'bg-rose-500/20 text-rose-500 animate-pulse-dot border border-rose-500/50'
            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
        }`}
        title="Voice Input"
      >
        {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
      </button>

      <textarea
        className="flex-1 bg-transparent border-0 text-slate-200 placeholder:text-slate-500 p-3 outline-none resize-none custom-scrollbar"
        placeholder="Type your message or use voice input..."
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
        className={`p-3 rounded-xl transition shrink-0 ${
          disabled || !text.trim()
            ? 'opacity-50 cursor-not-allowed text-slate-500'
            : 'bg-primary text-white hover:bg-blue-600 shadow-glow shadow-primary/30'
        }`}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}

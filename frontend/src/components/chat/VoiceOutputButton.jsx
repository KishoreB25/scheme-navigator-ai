import { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { voiceService } from '../../services/voiceService';

export default function VoiceOutputButton({ text, language = 'en-US' }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isPlaying) {
      voiceService.stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      
      // Strip markdown
      const cleanText = text.replace(/[*_#`\[\]]/g, '');
      
      voiceService.speakText(cleanText, language, () => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <button
      onClick={toggleSpeech}
      className={`p-1.5 rounded-md transition-colors flex items-center ${
        isPlaying
          ? 'bg-primary/20 text-primary animate-pulse'
          : 'hover:bg-surface/50 text-slate-400 hover:text-slate-200'
      }`}
      title={isPlaying ? "Stop listening" : "Listen to response"}
    >
      {isPlaying ? <Square size={14} /> : <Volume2 size={14} />}
      {isPlaying && <span className="ml-1 text-[10px] font-medium">Playing</span>}
    </button>
  );
}

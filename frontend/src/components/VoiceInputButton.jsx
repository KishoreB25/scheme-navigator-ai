import { useVoice } from '../hooks/useVoice';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceInputButton({ onTranscript }) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    language,
    isSupported,
    startListening,
    stopListening,
    changeLanguage,
    supportedLanguages,
  } = useVoice();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((finalTranscript) => {
        if (onTranscript) {
          onTranscript(finalTranscript);
        }
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="px-3 py-2 border border-blue-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-blue-50 to-indigo-50 font-sans"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label.split('(')[0].trim()}
          </option>
        ))}
      </select>

      <button
        onClick={handleClick}
        title={isListening ? 'Stop recording' : 'Start recording'}
        className={`p-2 rounded-lg transition relative overflow-hidden flex items-center justify-center ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isListening ? (
          <>
             <MicOff size={20} className="relative z-10" />
             <div className="absolute inset-0 bg-red-400 animate-ping opacity-75"></div>
          </>
        ) : (
          <Mic size={20} />
        )}
      </button>

      {(transcript || interimTranscript) && (
        <div className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 max-w-xs truncate flex items-center gap-2">
          {isListening && (
            <div className="flex gap-0.5 items-end h-3">
               <span className="w-0.5 bg-blue-500 h-full animate-[bounce_1s_infinite]"></span>
               <span className="w-0.5 bg-blue-500 h-2/3 animate-[bounce_1s_infinite_0.2s]"></span>
               <span className="w-0.5 bg-blue-500 h-1/2 animate-[bounce_1s_infinite_0.4s]"></span>
            </div>
          )}
          {transcript || interimTranscript}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-700 bg-red-100 px-3 py-1 rounded-lg border border-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

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
        className={`p-2 rounded-lg transition ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {(transcript || interimTranscript) && (
        <div className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 max-w-xs truncate">
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

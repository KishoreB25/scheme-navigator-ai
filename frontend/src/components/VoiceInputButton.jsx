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
        className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron"
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
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
          {transcript || interimTranscript}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

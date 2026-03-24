import { useState, useCallback } from 'react';
import voiceService from '../services/voiceService';

/**
 * Custom hook for managing voice input state
 */
export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [isSupported] = useState(() => voiceService.isSupported());

  const startListening = useCallback((onFinal = null) => {
    if (!isSupported) {
      setError('Voice input is not supported in your browser');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);

    voiceService.startListening({
      language,
      onResult: (finalTranscript) => {
        setTranscript(finalTranscript);
        setInterimTranscript('');
        setIsListening(false);
        if (onFinal) onFinal(finalTranscript);
      },
      onInterim: (interim) => {
        setInterimTranscript(interim);
      },
      onError: (err) => {
        console.error('Voice error:', err);
        setError(typeof err === 'string' ? err : err.message || 'Voice recognition failed');
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  }, [language, isSupported]);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, []);

  const abort = useCallback(() => {
    voiceService.abort();
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const changeLanguage = useCallback((newLanguage) => {
    setLanguage(newLanguage);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    language,
    isSupported,
    startListening,
    stopListening,
    abort,
    clearTranscript,
    changeLanguage,
    supportedLanguages: voiceService.getSupportedLanguages(),
  };
};

export default useVoice;

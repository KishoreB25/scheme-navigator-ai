/**
 * Web Speech API wrapper for voice input
 * Handles speech-to-text conversion with fallback for unsupported browsers
 */

const getSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    return null;
  }
  return new SpeechRecognition();
};

let recognition = null;

export const voiceService = {
  /**
   * Check if voice input is supported in this browser
   */
  isSupported: () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  /**
   * Start voice recording and transcription
   * @param {object} options - Configuration options
   * @param {function} onResult - Callback when final result is ready: (transcript) => void
   * @param {function} onInterim - Callback for interim results: (transcript) => void
   * @param {function} onError - Callback for errors: (error) => void
   * @param {function} onEnd - Callback when recording ends: () => void
   * @param {string} language - Language code (default: 'en-US')
   */
  startListening: (options = {}) => {
    const {
      onResult = () => {},
      onInterim = () => {},
      onError = () => {},
      onEnd = () => {},
      language = 'en-US',
    } = options;

    if (!voiceService.isSupported()) {
      onError('Voice input is not supported in your browser');
      return;
    }

    recognition = getSpeechRecognition();
    if (!recognition) return;

    recognition.language = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let interimTranscript = '';

    recognition.onstart = () => {
      console.log('Voice recognition started');
    };

    recognition.onresult = (event) => {
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          onResult(transcript);
        } else {
          interimTranscript += transcript;
          onInterim(interimTranscript);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      onEnd();
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      onError(error.message);
    }
  },

  /**
   * Stop voice recording
   */
  stopListening: () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  },

  /**
   * Abort voice recording immediately
   */
  abort: () => {
    if (recognition) {
      try {
        recognition.abort();
      } catch (error) {
        console.error('Error aborting recognition:', error);
      }
    }
  },

  /**
   * Get supported languages
   */
  getSupportedLanguages: () => {
    return [
      { code: 'en-US', label: 'English (US)' },
      { code: 'en-IN', label: 'English (India)' },
      { code: 'hi-IN', label: 'Hindi' },
      { code: 'ta-IN', label: 'Tamil' },
      { code: 'te-IN', label: 'Telugu' },
      { code: 'kn-IN', label: 'Kannada' },
      { code: 'ml-IN', label: 'Malayalam' },
      { code: 'mr-IN', label: 'Marathi' },
    ];
  },
};

export default voiceService;

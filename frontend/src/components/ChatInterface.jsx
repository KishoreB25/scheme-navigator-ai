import { useChat } from '../hooks/useChat';
import { useProfile } from '../hooks/useProfile';
import { useState } from 'react';
import MessageBubble from './MessageBubble';
import VoiceInputButton from './VoiceInputButton';
import SchemeGrid from './SchemeGrid';
import MissedBenefitsPanel from './MissedBenefitsPanel';

export default function ChatInterface({ demoMode = false }) {
  const { messages, isLoading, error, sendQuery, clearHistory } = useChat();
  const { profile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const [showMissedBenefits, setShowMissedBenefits] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    await sendQuery(query, profile);
  };

  const handleVoiceInput = (transcript) => {
    setInputValue(transcript);
  };

  // Get the last assistant message with schemes
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((msg) => msg.sender === 'assistant' && msg.schemes?.length > 0);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-saffron to-bharat-blue text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Government Schemes Assistant</h2>
            <p className="text-sm opacity-90">Get information about schemes you're eligible for</p>
          </div>
          <button
            onClick={clearHistory}
            className="bg-white text-saffron px-3 py-1 rounded text-sm font-semibold hover:bg-opacity-90 transition"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">🇮🇳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to PolicyGPT Bharat</h3>
              <p className="text-gray-600">
                Ask about government schemes you're eligible for
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Try: "What schemes am I eligible for?" or use the voice button 🎤
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.sender === 'user'}
            />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg rounded-tl-none px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Display Schemes if available */}
      {lastAssistantMessage?.schemes?.length > 0 && (
        <div className="border-t px-4 py-4">
          <h3 className="font-bold text-gray-800 mb-3">Eligible Schemes:</h3>
          <SchemeGrid schemes={lastAssistantMessage.schemes} />

          {!showMissedBenefits && (
            <button
              onClick={() => setShowMissedBenefits(true)}
              className="mt-4 bg-bharat-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition font-semibold w-full"
            >
              🔍 Find Your Missed Benefits
            </button>
          )}
        </div>
      )}

      {/* Missed Benefits */}
      {showMissedBenefits && lastAssistantMessage && (
        <div className="border-t px-4 py-4 max-h-60 overflow-y-auto">
          <MissedBenefitsPanel userProfile={profile} />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-4 rounded-b-lg">
        <div className="flex space-x-2">
          <VoiceInputButton onTranscript={handleVoiceInput} />

          <form onSubmit={handleSendMessage} className="flex-1 flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about schemes, eligibility, documents needed..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-saffron text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Government Schemes Assistant</h2>
            <p className="text-sm text-blue-100 font-light">Discover schemes you're eligible for</p>
          </div>
          <button
            onClick={clearHistory}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-white/30"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-7xl mb-6">
                <span className="animate-float">🇮🇳</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-3">Welcome to PolicyGPT Bharat</h3>
              <p className="text-gray-600 text-lg">
                Discover government schemes you're eligible for
              </p>
              <p className="text-sm text-gray-500 mt-6 leading-relaxed">
                💡 Try: <span className="text-blue-600 font-medium">"What schemes am I eligible for?"</span> or use the voice button 🎤
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
          <div className="flex justify-start mb-4 animate-fade-in">
            <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 border border-gray-200 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Display Schemes if available */}
      {lastAssistantMessage?.schemes?.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-5 bg-white">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">✨ Eligible Schemes</h3>
          <SchemeGrid schemes={lastAssistantMessage.schemes} />

          {!showMissedBenefits && (
            <button
              onClick={() => setShowMissedBenefits(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold w-full"
            >
              🔍 Find Your Missed Benefits
            </button>
          )}
        </div>
      )}

      {/* Missed Benefits */}
      {showMissedBenefits && lastAssistantMessage && (
        <div className="border-t border-gray-200 px-6 py-5 max-h-60 overflow-y-auto custom-scrollbar bg-gray-50">
          <MissedBenefitsPanel userProfile={profile} />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6 bg-white rounded-b-xl">
        <div className="flex space-x-3">
          <VoiceInputButton onTranscript={handleVoiceInput} />

          <form onSubmit={handleSendMessage} className="flex-1 flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about schemes, eligibility, documents needed..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

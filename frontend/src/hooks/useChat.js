import { useState, useCallback } from 'react';
import { sendMessage } from '../services/api';

const STORAGE_KEY = 'chat_history';
const SCHEMA_VERSION = 1;

/**
 * Custom hook for managing chat state and history
 */
export const useChat = () => {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const data = JSON.parse(stored);
      return data.version === SCHEMA_VERSION ? data.messages : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist messages to localStorage
  const persistMessages = useCallback((newMessages) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SCHEMA_VERSION,
          messages: newMessages,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error('Failed to persist chat:', err);
    }
  }, []);

  // Add a single message
  const addMessage = useCallback(
    (content, sender = 'user', metadata = {}) => {
      const newMessage = {
        id: Date.now().toString(),
        content,
        sender,
        timestamp: new Date().toISOString(),
        ...metadata,
      };
      setMessages((prev) => {
        const updated = [...prev, newMessage];
        persistMessages(updated);
        return updated;
      });
      return newMessage;
    },
    [persistMessages]
  );

  // Send a query and get response
  const sendQuery = useCallback(
    async (query, userProfile = {}) => {
      if (!query.trim()) {
        setError('Please enter a query');
        return null;
      }

      setError(null);
      setIsLoading(true);

      // Add user message
      addMessage(query, 'user');

      try {
        const response = await sendMessage(query, userProfile);

        // Add bot response
        addMessage(response.text || 'No response received', 'assistant', {
          schemes: response.schemes || [],
          intent: response.intent,
          session_id: response.session_id,
          eligible_count: response.eligible_count,
          total_schemes: response.total_schemes,
          compliance_verified: response.compliance_verified,
        });

        return response;
      } catch (err) {
        const errorMsg = err.message || 'Failed to get response';
        setError(errorMsg);
        addMessage(`Error: ${errorMsg}`, 'assistant', { isError: true });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  // Update a specific message
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      persistMessages(updated);
      return updated;
    });
  }, [persistMessages]);

  // Clear all messages
  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get last message
  const lastMessage = messages[messages.length - 1] || null;

  return {
    messages,
    isLoading,
    error,
    addMessage,
    sendQuery,
    updateMessage,
    clearHistory,
    lastMessage,
  };
};

export default useChat;

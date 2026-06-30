import { useState, useCallback, useEffect, useRef } from 'react';
import { getChatHistory, sendMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'chat_history';
const SESSION_PREFIX = 'chat_session_id';
const SCHEMA_VERSION = 2;

const createSessionId = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `session_${Date.now()}_${Math.random().toString(16).slice(2)}`);

const toMessage = (message) => ({
  id: `${message.created_at || message.timestamp || Date.now()}_${message.role || 'assistant'}`,
  content: message.content || '',
  sender: message.role === 'assistant' ? 'assistant' : 'user',
  timestamp: message.created_at || message.timestamp || new Date().toISOString(),
  session_id: message.session_id,
  schemes: message.schemes || [],
  intent: message.intent,
  eligible_count: message.eligible_count,
  total_schemes: message.total_schemes,
  compliance_verified: message.compliance_verified,
  response_type: message.response_type,
  isError: message.isError || false,
});

const getUserStorageKey = (userId) => `${STORAGE_PREFIX}:${userId}`;
const getSessionStorageKey = (userId) => `${SESSION_PREFIX}:${userId}`;

const getSessionFromMessages = (messages) => {
  if (!messages.length) return null;
  return messages[messages.length - 1].session_id || null;
};

const isTransientErrorMessage = (message) => {
  const content = String(message?.content || '').toLowerCase();
  return Boolean(message?.isError) || content.startsWith('error:');
};

const pickLatestValidSession = (messages) => {
  if (!messages.length) return null;

  const sessions = new Map();

  for (const message of messages) {
    const sessionKey = message.session_id || '__no_session__';
    if (!sessions.has(sessionKey)) {
      sessions.set(sessionKey, []);
    }
    sessions.get(sessionKey).push(message);
  }

  const orderedSessions = Array.from(sessions.entries());

  for (let i = orderedSessions.length - 1; i >= 0; i -= 1) {
    const [sessionKey, sessionMessages] = orderedSessions[i];
    const hasRealMessage = sessionMessages.some((message) => !isTransientErrorMessage(message));
    if (hasRealMessage && sessionKey !== '__no_session__') {
      return sessionKey;
    }
  }

  return null;
};

const loadStoredHistory = (userId) => {
  if (!userId) return { messages: [], sessionId: null };

  try {
    const stored = localStorage.getItem(getUserStorageKey(userId));
    if (!stored) return { messages: [], sessionId: null };

    const data = JSON.parse(stored);
    if (data.version !== SCHEMA_VERSION) return { messages: [], sessionId: null };

    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      sessionId: data.sessionId || null,
    };
  } catch {
    return { messages: [], sessionId: null };
  }
};

/**
 * Custom hook for managing chat state and history
 */
export const useChat = () => {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [historyLoadedFor, setHistoryLoadedFor] = useState(null);
  const sessionIdRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistConversation = useCallback((nextMessages, nextSessionId) => {
    if (!userId) return;

    try {
      localStorage.setItem(
        getUserStorageKey(userId),
        JSON.stringify({
          version: SCHEMA_VERSION,
          sessionId: nextSessionId,
          messages: nextMessages,
          timestamp: new Date().toISOString(),
        })
      );
      localStorage.setItem(getSessionStorageKey(userId), nextSessionId);
    } catch (err) {
      console.error('Failed to persist chat:', err);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!userId) {
        setMessages([]);
        setSessionId(null);
        setHistoryLoadedFor(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const stored = loadStoredHistory(userId);
      const storedSession = localStorage.getItem(getSessionStorageKey(userId));

      try {
        const response = await getChatHistory(userId, null, 100);
        if (cancelled) return;

        const rawMessages = Array.isArray(response.messages) ? response.messages : [];
        const latestSessionId = pickLatestValidSession(rawMessages) || stored.sessionId || storedSession || createSessionId();
        const sessionMessages = latestSessionId
          ? rawMessages.filter((message) => message.session_id === latestSessionId)
          : rawMessages;

        const normalized = sessionMessages
          .filter((message) => !isTransientErrorMessage(message))
          .map(toMessage);
        const hydratedMessages = normalized.length
          ? normalized
          : (stored.messages || []).filter((message) => !isTransientErrorMessage(message));
        setMessages(hydratedMessages);
        setSessionId(latestSessionId);
        sessionIdRef.current = latestSessionId;
        setHistoryLoadedFor(userId);
        persistConversation(hydratedMessages, latestSessionId);
      } catch (historyError) {
        if (cancelled) return;

        const fallbackMessages = (stored.messages || [])
          .filter((message) => !isTransientErrorMessage(message))
          .map((message) => ({
            ...message,
            sender: message.sender || (message.role === 'assistant' ? 'assistant' : 'user'),
          }));
        const fallbackSessionId = stored.sessionId || storedSession || createSessionId();

        setMessages(fallbackMessages);
        setSessionId(fallbackSessionId);
      sessionIdRef.current = fallbackSessionId;
        setError(null);
        setHistoryLoadedFor(userId);
        persistConversation(fallbackMessages, fallbackSessionId);
        console.warn('Falling back to local chat history:', historyError);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [persistConversation, userId]);

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
        const currentSessionId = sessionIdRef.current || createSessionId();
        sessionIdRef.current = currentSessionId;
        if (!sessionId) {
          setSessionId(currentSessionId);
        }
        persistConversation(updated, currentSessionId);
        return updated;
      });
      return newMessage;
    },
    [persistConversation, sessionId]
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
        const activeSessionId = sessionIdRef.current || createSessionId();
        sessionIdRef.current = activeSessionId;
        if (!sessionId) {
          setSessionId(activeSessionId);
        }

        const response = await sendMessage(query, userProfile, userId, activeSessionId);

        // Add bot response
        addMessage(response.text || 'No response received', 'assistant', {
          schemes: response.schemes || [],
          intent: response.intent,
          session_id: response.session_id,
          eligible_count: response.eligible_count,
          total_schemes: response.total_schemes,
          compliance_verified: response.compliance_verified,
          response_type: response.response_type || 'scheme_results',
        });

        if (response.session_id && response.session_id !== sessionIdRef.current) {
          sessionIdRef.current = response.session_id;
          setSessionId(response.session_id);
        }

        return response;
      } catch (err) {
        const errorMsg = err.message || 'Failed to get response';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, sessionId, userId]
  );

  // Update a specific message
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      persistConversation(updated, sessionIdRef.current || createSessionId());
      return updated;
    });
  }, [persistConversation]);

  // Clear all messages
  const clearHistory = useCallback(() => {
    setMessages([]);
    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);
    sessionIdRef.current = nextSessionId;
    if (userId) {
      localStorage.removeItem(getUserStorageKey(userId));
      localStorage.setItem(getSessionStorageKey(userId), nextSessionId);
    }
  }, [userId]);

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
    sessionId,
    historyLoadedFor,
  };
};

export default useChat;

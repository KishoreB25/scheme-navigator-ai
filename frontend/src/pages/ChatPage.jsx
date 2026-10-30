import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWorkspace from '../components/chat/ChatWorkspace';
import MatchingSidebar from '../components/chat/MatchingSidebar';
import PageHeader from '../components/ui/PageHeader';
import useChat from '../hooks/useChat';
import useProfile from '../hooks/useProfile';
export default function ChatPage() { const { messages, isLoading, error, sendQuery } = useChat(); const { profile } = useProfile(); const location = useLocation(); const handledQuery = useRef(null); useEffect(() => { const query = location.state?.query; if (query && handledQuery.current !== query) { handledQuery.current = query; sendQuery(query, profile); window.history.replaceState({}, document.title); } }, [location.state, profile, sendQuery]); const sendWithProfile = query => sendQuery(query, profile); return <main className="page"><PageHeader eyebrow="AI-guided discovery" title="Find support that fits your life." description="Ask naturally. We’ll map your question to government programmes and eligibility details."/><div className="dashboard-grid"><ChatWorkspace messages={messages} isLoading={isLoading} error={error} onSend={sendWithProfile}/><MatchingSidebar profile={profile}/></div></main>; }

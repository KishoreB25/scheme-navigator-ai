import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AlertsPage from './pages/AlertsPage';
import GuidePage from './pages/GuidePage';

function App() {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-background text-slate-100">
      {/* Background decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/10 blur-[140px] pointer-events-none animate-blob"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-accent/10 blur-[140px] pointer-events-none animate-blob" style={{ animationDelay: '2.5s' }}></div>
      <div className="fixed top-[30%] left-[55%] w-[35%] h-[35%] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-blob" style={{ animationDelay: '5s' }}></div>

      <Sidebar />
      
      <main className="flex-1 h-full relative z-10 overflow-y-auto bg-transparent">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/guide/:schemeId" element={<GuidePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

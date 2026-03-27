import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AlertsPage from './pages/AlertsPage';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 selection:bg-blue-200 text-gray-800">
      {/* Background decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[120px] pointer-events-none opacity-40"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px] pointer-events-none opacity-40" style={{ animationDelay: '2s' }}></div>
      <div className="fixed top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-gray-100 blur-[120px] pointer-events-none opacity-30" style={{ animationDelay: '4s' }}></div>

      <Sidebar />
      
      <main className="flex-1 h-full relative z-10 overflow-y-auto bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import ProfileForm from '../components/ProfileForm';
import RightPanel from '../components/RightPanel';
import './Home.css';

export default function Home() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 min-h-[calc(100vh-80px)]">
        {/* Right Panel - Sign in or Profile Info */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <RightPanel />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}

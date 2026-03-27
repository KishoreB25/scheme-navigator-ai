import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import ProfileForm from '../components/ProfileForm';
import './Home.css';

export default function Home() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 min-h-[calc(100vh-80px)]">
        {/* Sidebar - User Profile */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              {showProfile ? 'Hide' : 'Show'} Profile
            </button>
            {showProfile && <ProfileForm />}
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

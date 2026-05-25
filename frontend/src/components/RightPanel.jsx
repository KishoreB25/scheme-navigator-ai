import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { LogOut, MapPin, GraduationCap, IndianRupee, Users } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RightPanel() {
  const { user, logout, createGuestProfile } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  const handleCreateGuestProfile = async () => {
    try {
      setIsCreatingGuest(true);
      await createGuestProfile('Guest User', {});
    } catch (err) {
      console.error('Failed to create guest profile:', err);
    } finally {
      setIsCreatingGuest(false);
    }
  };

  // Not logged in and not guest
  if (!user) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-5 border border-gray-200 shadow-sm sticky top-20">
        <h3 className="font-bold text-xl text-gray-800 pb-3 border-b border-gray-200 flex items-center">
          <span className="mr-2">🔍</span>ACTIVE SEARCH FILTERS
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center space-y-3">
          <p className="text-gray-700 text-sm">
            Sign in to save your profile and get personalized scheme recommendations.
          </p>
          <GoogleLoginButton />
        </div>

        <div className="text-center pt-2 space-y-2">
          <p className="text-xs text-gray-600">or</p>
          <button
            onClick={handleCreateGuestProfile}
            disabled={isCreatingGuest}
            className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingGuest ? 'Creating Profile...' : 'Create Profile without Sign In'}
          </button>
        </div>
      </div>
    );
  }

  // Guest user
  if (user.isGuest) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-5 border border-gray-200 shadow-sm sticky top-20">
        <h3 className="font-bold text-xl text-gray-800 pb-3 border-b border-gray-200 flex items-center">
          <span className="mr-2">🔍</span>ACTIVE SEARCH FILTERS
        </h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-semibold text-gray-800">Guest User</p>
              <p className="text-xs text-gray-600">Sign in to save your data permanently</p>
            </div>
          </div>
        </div>

        {/* Current Persona */}
        {profile && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-gray-600 mb-3">CURRENT PERSONA</p>
            <div className="space-y-2 text-sm">
              {profile.state && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{profile.state}</span>
                </div>
              )}
              {profile.occupation && (
                <div className="flex items-center gap-2 text-gray-700">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>{profile.occupation}</span>
                </div>
              )}
              {profile.income && (
                <div className="flex items-center gap-2 text-gray-700">
                  <IndianRupee className="w-4 h-4 text-blue-600" />
                  <span>₹{profile.income.toLocaleString()}/year</span>
                </div>
              )}
              {profile.age && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{profile.age} yrs</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <a
            href="/profile"
            className="w-full border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-semibold text-sm text-center"
          >
            Edit Profile
          </a>
          <GoogleLoginButton />
        </div>
      </div>
    );
  }

  // Authenticated user
  return (
    <div className="bg-white rounded-lg p-6 space-y-5 border border-gray-200 shadow-sm sticky top-20">
      <h3 className="font-bold text-xl text-gray-800 pb-3 border-b border-gray-200 flex items-center">
        <span className="mr-2">🔍</span>ACTIVE SEARCH FILTERS
      </h3>

      {/* User Info Sticker - Large Avatar */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-4 mb-3">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-orange-300" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {user.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✓ Verified</span>
          </div>
        </div>
      </div>

      {/* Current Persona */}
      {profile && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-semibold text-gray-600 mb-3">CURRENT PERSONA</p>
          <div className="space-y-2 text-sm">
            {profile.state && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{profile.state}</span>
              </div>
            )}
            {profile.occupation && (
              <div className="flex items-center gap-2 text-gray-700">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>{profile.occupation}</span>
              </div>
            )}
            {profile.income && (
              <div className="flex items-center gap-2 text-gray-700">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <span>₹{profile.income.toLocaleString()}/year</span>
              </div>
            )}
            {profile.age && (
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{profile.age} yrs</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2"
        >
          ✏️ Update Profile
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition font-semibold text-sm border border-gray-600"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

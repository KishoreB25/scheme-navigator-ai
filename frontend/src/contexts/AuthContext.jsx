import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, checkBackendReady } from '../services/api';

const AuthContext = createContext();

// Store guest UID in localStorage
const GUEST_UID_KEY = 'guest_firebase_uid';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();

          // Check if user was guest before
          const guestUid = localStorage.getItem(GUEST_UID_KEY);

          // Send token to backend for verification and user creation
          const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: idToken,
              guest_firebase_uid: guestUid || null,  // Send guest UID if exists
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to authenticate with backend');
          }

          const data = await response.json();
          
          // Store user data in state
          setUser({
            uid: data.user.uid,
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture,
            profileCompleted: data.user.profileCompleted,
            profile: data.user.profile,
            isNewUser: data.isNewUser,
            isGuest: false,
          });

          // Clear guest UID from localStorage
          if (guestUid) {
            localStorage.removeItem(GUEST_UID_KEY);
            console.log('[Auth] Guest data merged with authenticated account');
          }

          setError(null);
        } catch (err) {
          console.error('Auth error:', err);
          setError(err.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check if backend is ready on app initialization
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        console.log('🔄 Checking backend readiness...');
        await checkBackendReady(60000); // Wait up to 60 seconds
        console.log('✅ Backend initialized and ready');
      } catch (err) {
        console.warn('⚠️ Backend initialization check:', err.message);
        // Continue anyway - backend might be initializing
      }
    };

    initializeBackend();
  }, []);

  const loginWithGoogle = async () => {
    if (isSigningIn) {
      return null;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      setIsSigningIn(true);
      setIsLoading(true);
      setError(null);
      
      const result = await signInWithPopup(auth, provider);
      
      // Firebase automatically triggers onAuthStateChanged
      return result.user;
    } catch (err) {
      console.error('Login error:', err);

      // This usually means another popup request is already in progress
      if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in is already in progress. Please complete the opened Google window.');
        return null;
      }

      // Browser blocked popup; fallback to redirect flow
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return null;
      }

      setError(err.message);
      throw err;
    } finally {
      setIsSigningIn(false);
      setIsLoading(false);
    }
  };

  const createGuestProfile = async (name, profile) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          profile: profile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guest profile');
      }

      const data = await response.json();

      // Store guest UID for later merge
      localStorage.setItem(GUEST_UID_KEY, data.guest_firebase_uid);

      // Set user in state as guest
      setUser({
        uid: data.guest_firebase_uid,
        email: null,
        name: data.name,
        picture: null,
        profileCompleted: data.profileCompleted,
        profile: profile || null,
        isNewUser: true,
        isGuest: true,
        idToken: null,
      });

      setError(null);
      return data;
    } catch (err) {
      console.error('Guest profile creation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut(auth);
      localStorage.removeItem(GUEST_UID_KEY);
      localStorage.removeItem('user_profile');  // Clear profile on logout
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    loginWithGoogle,
    createGuestProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

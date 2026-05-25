import { useState, useCallback, useEffect } from 'react';
import { updateProfile as updateProfileAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'user_profile';

/**
 * Custom hook for managing user profile state
 * Profile is stored as:
 * {
 *   name: "Full Name",  // Top level
 *   age, income, state, gender, occupation  // In profile object
 * }
 */
export const useProfile = () => {
  const { user, createGuestProfile } = useAuth();
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            name: '',
            age: null,
            income: null,
            state: '',
            gender: '',
            occupation: '',
          };
    } catch {
      return {
        name: '',
        age: null,
        income: null,
        state: '',
        gender: '',
        occupation: '',
      };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize profile with Firebase user data if available
  useEffect(() => {
    if (user && user.name) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
      }));
    } else if (!user) {
      // User logged out - clear profile data from state but keep localStorage for guests
      // Profile will be reloaded from localStorage on next login if guest
      setProfile({
        name: '',
        age: null,
        income: null,
        state: '',
        gender: '',
        occupation: '',
      });
    }
  }, [user]);

  // Validate profile data
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'name':
        return !value || (value.trim().length > 0 && value.length <= 100);
      case 'age':
        return value !== null && value > 0 && value < 120;
      case 'income':
        return value !== null && value >= 0;
      case 'state':
        return value && value.trim().length > 0;
      case 'gender':
        return ['Male', 'Female', 'Other', ''].includes(value);
      case 'occupation':
        return value.trim().length >= 0;
      default:
        return true;
    }
  }, []);

  // Update a single field
  const updateField = useCallback((field, value) => {
    if (!validateField(field, value)) {
      setError(`Invalid value for ${field}`);
      return false;
    }
    setError(null);
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save profile locally:', err);
      }
      return updated;
    });
    return true;
  }, [validateField]);

  // Save profile to backend or create guest profile
  const save = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user && user.isGuest === false) {
        // Authenticated user - update via /profile endpoint
        const response = await updateProfileAPI(user.uid, profile);
        if (response && response.firebase_uid) {
          localStorage.setItem('firebaseUid', response.firebase_uid);
        }
        return response;
      } else if (user && user.isGuest === true) {
        // Guest user - also update backend MongoDB record, not just localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        
        // Also update the backend with guest profile changes
        try {
          const response = await updateProfileAPI(user.uid, profile);
          return response;
        } catch (err) {
          console.warn('Failed to sync guest profile to backend, but local save succeeded:', err);
          return { saved: true, message: 'Guest profile updated locally' };
        }
      } else {
        // Not logged in - create guest profile
        const response = await createGuestProfile(profile.name, {
          age: profile.age,
          income: profile.income,
          state: profile.state,
          gender: profile.gender,
          occupation: profile.occupation,
        });
        return response;
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to save profile';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile, user, createGuestProfile]);

  // Reset to empty profile
  const reset = useCallback(() => {
    const emptyProfile = {
      name: user?.name || '',
      age: null,
      income: null,
      state: '',
      gender: '',
      occupation: '',
    };
    setProfile(emptyProfile);
    localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  // Check if profile is complete (all required fields filled)
  const isComplete = useCallback(
    () =>
      profile.age !== null &&
      profile.income !== null &&
      profile.state.trim() !== '' &&
      profile.gender !== '',
    [profile]
  );

  return {
    profile,
    isLoading,
    error,
    updateField,
    save,
    reset,
    isComplete,
  };
};

export default useProfile;

import { useState, useCallback } from 'react';
import { saveProfile } from '../services/api';

const STORAGE_KEY = 'user_profile';

/**
 * Custom hook for managing user profile state
 */
export const useProfile = () => {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            age: null,
            income: null,
            state: '',
            gender: '',
            occupation: '',
          };
    } catch {
      return {
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

  // Validate profile data
  const validateField = useCallback((field, value) => {
    switch (field) {
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
        console.error('Failed to save profile:', err);
      }
      return updated;
    });
    return true;
  }, [validateField]);

  // Save profile to backend
  const save = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await saveProfile(profile);
      if (response.user_id) {
        localStorage.setItem('userId', response.user_id);
      }
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to save profile';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Reset to empty profile
  const reset = useCallback(() => {
    const emptyProfile = {
      age: null,
      income: null,
      state: '',
      gender: '',
      occupation: '',
    };
    setProfile(emptyProfile);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('userId');
  }, []);

  // Check if profile is complete
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

import { useState } from 'react';
import { getMissedBenefits } from '../services/api';
import SchemeCard from './SchemeCard';

export default function MissedBenefitsPanel({ userProfile }) {
  const [missedSchemes, setMissedSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadMissedBenefits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMissedBenefits(userProfile);
      setMissedSchemes(response.schemes || []);
      setHasLoaded(true);
    } catch (err) {
      setError(err.message || 'Failed to load missed benefits');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasLoaded) {
    return (
      <button
        onClick={loadMissedBenefits}
        disabled={isLoading}
        className="w-full bg-bharat-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 font-semibold"
      >
        {isLoading ? '⏳ Scanning...' : '🔍 Check Missed Benefits'}
      </button>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-lg text-gray-800 mb-3">
        ✨ You are also eligible for:
      </h3>

      {error && (
        <div className="text-sm text-red-600 bg-red-100 px-3 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {missedSchemes.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>You're already aware of all schemes you're eligible for!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {missedSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}

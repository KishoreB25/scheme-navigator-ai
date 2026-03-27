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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition disabled:opacity-50 font-semibold"
      >
        {isLoading ? '⏳ Scanning...' : '🔍 Check Missed Benefits'}
      </button>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-lg text-gray-800 mb-4">
        ✨ You are also eligible for:
      </h3>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 px-4 py-3 rounded-lg border border-red-200 mb-4">
          {error}
        </div>
      )}

      {missedSchemes.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>🌟 You're already aware of all schemes you're eligible for!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {missedSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}

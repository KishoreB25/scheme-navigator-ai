import { useProfile } from '../hooks/useProfile';
import { useState } from 'react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function ProfileForm() {
  const { profile, updateField, save, reset, isLoading, error, isComplete } = useProfile();
  const [saved, setSaved] = useState(false);

  const handleInputChange = (field, value) => {
    updateField(field, value);
    setSaved(false);
  };

  const handleSave = async () => {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Your Profile</h3>

      {/* Age */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
        <input
          type="number"
          value={profile.age || ''}
          onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="e.g., 35"
          min="1"
          max="120"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
        />
      </div>

      {/* Income */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Income (₹)</label>
        <input
          type="number"
          value={profile.income || ''}
          onChange={(e) => handleInputChange('income', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="e.g., 200000"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
        />
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
        <select
          value={profile.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
        >
          <option value="">Select State</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
        <div className="flex space-x-3">
          {['Male', 'Female', 'Other'].map((option) => (
            <label key={option} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={option}
                checked={profile.gender === option}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Occupation */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
        <select
          value={profile.occupation}
          onChange={(e) => handleInputChange('occupation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
        >
          <option value="">Select Occupation</option>
          <option value="Farmer">Farmer</option>
          <option value="Student">Student</option>
          <option value="Employed">Employed</option>
          <option value="Self Employed">Self Employed</option>
          <option value="Retired">Retired</option>
          <option value="Homemaker">Homemaker</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-100 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex gap-2 text-xs">
        {isComplete() && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Complete</span>}
        {saved && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">✓ Saved</span>}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 bg-saffron text-white px-3 py-2 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 font-semibold"
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
        <button
          onClick={reset}
          className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

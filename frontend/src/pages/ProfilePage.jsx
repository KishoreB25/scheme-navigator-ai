import { useState } from 'react';
import { updateProfile } from '../services/api';
import { User, MapPin, Briefcase, IndianRupee, Save, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    income: '',
    state: '',
    gender: 'Male',
    occupation: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Send to backend
    await updateProfile(formData);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm animate-slide-up">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <User className="text-white w-6 h-6" />
            </div>
            Your Profile
          </h2>
          <p className="text-blue-100 mt-2">
            Complete your profile to let PolicyGPT perfectly map you to hundreds of government schemes. Your data remains completely private.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-gray-400"
                placeholder="e.g. john_doe"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Age
              </label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-gray-400"
                placeholder="e.g. 30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> State
              </label>
              <select
                name="state"
                value={formData.state}
                required
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-blue-600" /> Annual Income (₹)
              </label>
              <input
                type="number"
                name="income"
                required
                value={formData.income}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-gray-400"
                placeholder="e.g. 250000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> Occupation
              </label>
              <input
                type="text"
                name="occupation"
                required
                value={formData.occupation}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-gray-400"
                placeholder="e.g. Farmer, Student, Entrepreneur"
              />
            </div>

          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-200">
            <span className={`text-green-600 flex items-center gap-2 text-sm font-medium transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
              <Save size={16} /> Profile Saved!
            </span>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all flex items-center gap-2 ${
                loading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { updateProfile } from '../services/api';
import { User, MapPin, Briefcase, IndianRupee, Save, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
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
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto glass-card border border-slate-700/50 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="p-8 border-b border-slate-700/50 bg-slate-900/30">
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/20">
              <User className="text-primary w-6 h-6" />
            </div>
            Your Profile
          </h2>
          <p className="text-slate-400 mt-2">
            Complete your profile to let PolicyGPT perfectly map you to hundreds of government schemes. Your data remains completely private.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Age
              </label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                placeholder="e.g. 30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> State
              </label>
              <select
                name="state"
                value={formData.state}
                required
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
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
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-400" /> Annual Income (₹)
              </label>
              <input
                type="number"
                name="income"
                required
                value={formData.income}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                placeholder="e.g. 250000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Occupation
              </label>
              <input
                type="text"
                name="occupation"
                required
                value={formData.occupation}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                placeholder="e.g. Farmer, Student, Entrepreneur"
              />
            </div>

          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-700/50">
            <span className={`text-emerald-400 flex items-center gap-2 text-sm font-medium transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
              <Save size={16} /> Profile Saved!
            </span>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium text-white shadow-glow transition-all flex items-center gap-2 ${
                loading ? 'bg-slate-600 cursor-wait outline-none' : 'bg-gradient-to-r from-primary to-blue-600 hover:to-blue-500 shadow-primary/30 hover:shadow-primary/50'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
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

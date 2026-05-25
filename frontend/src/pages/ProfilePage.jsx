import { useState, useEffect } from 'react';
import useProfile from '../hooks/useProfile';
import { User, MapPin, Briefcase, IndianRupee, Save, Calendar, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { profile, updateField, save, isLoading } = useProfile();
  
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    income: '',
    state: '',
    gender: 'Male',
    occupation: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync localStorage profile on mount
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        age: profile.age !== null ? profile.age.toString() : '',
        income: profile.income !== null ? profile.income.toString() : '',
        state: profile.state || '',
        gender: profile.gender || 'Male',
        occupation: profile.occupation || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Explicit sync to double-ensure values are updated in the hook state before saving
    updateField('username', formData.username);
    updateField('age', formData.age ? parseInt(formData.age, 10) : null);
    updateField('income', formData.income ? parseInt(formData.income, 10) : null);
    updateField('state', formData.state);
    updateField('gender', formData.gender);
    updateField('occupation', formData.occupation);

    const response = await save();
    setSaving(false);
    
    if (response) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Write reactively to the hook to keep storage in sync
    let parsedValue = value;
    if (name === 'age' || name === 'income') {
      parsedValue = value ? parseInt(value, 10) : null;
    }
    updateField(name, parsedValue);
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-transparent">
      <div className="max-w-2xl mx-auto bg-surface/40 backdrop-blur-xl rounded-2xl border border-border/80 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header Banner */}
        <div className="p-8 border-b border-border bg-gradient-to-r from-primary/10 via-accent/5 to-transparent flex items-start gap-5">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary shadow-glow select-none">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display tracking-wider text-white flex items-center gap-2">
              Citizen Profile Setup <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </h2>
            <p className="text-slate-350 text-sm mt-1.5 leading-relaxed font-sans">
              Enter your details so PolicySetu can accurately evaluate your eligibility and map you to hundreds of central & state government schemes.
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" /> Username / Full Name
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans"
                placeholder="e.g. John Doe"
              />
            </div>
            
            {/* Age */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Age (in Years)
              </label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans"
                placeholder="e.g. 30"
                min="1"
                max="120"
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Current State
              </label>
              <select
                name="state"
                value={formData.state}
                required
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans cursor-pointer"
              >
                <option value="" disabled className="bg-surface">Select State</option>
                <option value="Maharashtra" className="bg-surface text-slate-100">Maharashtra</option>
                <option value="Tamil Nadu" className="bg-surface text-slate-100">Tamil Nadu</option>
                <option value="Uttar Pradesh" className="bg-surface text-slate-100">Uttar Pradesh</option>
                <option value="Karnataka" className="bg-surface text-slate-100">Karnataka</option>
                <option value="Gujarat" className="bg-surface text-slate-100">Gujarat</option>
              </select>
            </div>

            {/* Annual Income */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5 text-primary" /> Annual Income (₹)
              </label>
              <input
                type="number"
                name="income"
                required
                value={formData.income}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans"
                placeholder="e.g. 250000"
                min="0"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" /> Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans cursor-pointer"
              >
                <option value="Male" className="bg-surface text-slate-100">Male</option>
                <option value="Female" className="bg-surface text-slate-100">Female</option>
                <option value="Other" className="bg-surface text-slate-100">Other</option>
              </select>
            </div>

            {/* Occupation */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Occupation / Employment Type
              </label>
              <input
                type="text"
                name="occupation"
                required
                value={formData.occupation}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border rounded-xl p-3.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all duration-300 font-sans"
                placeholder="e.g. Farmer, Student, Entrepreneur, Unemployed"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-6 flex items-center justify-between border-t border-border/80">
            <span className={`text-emerald-400 flex items-center gap-2 text-sm font-semibold tracking-wide transition-all duration-300 ${saved ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
              <Save size={16} /> Profile Sync Successful!
            </span>
            <button
              type="submit"
              disabled={saving || isLoading}
              className={`px-6 py-3.5 rounded-xl font-bold text-slate-950 transition-all duration-200 flex items-center gap-2 shadow-glow shadow-primary/10 hover:shadow-primary/25 cursor-pointer active:scale-95 ${
                saving || isLoading ? 'bg-primary/50 text-slate-900 cursor-wait' : 'bg-primary hover:bg-secondary'
              }`}
            >
              {saving || isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  Saving Setup...
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

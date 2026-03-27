import { useState, useEffect } from 'react';
import { getMissedBenefits } from '../services/api';
import SchemeCard from '../components/schemes/SchemeCard';
import { Bell, Zap, BellRing } from 'lucide-react';

export default function AlertsPage() {
  const [missedSchemes, setMissedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch missed benefits on mount
    const fetchAlerts = async () => {
      setLoading(true);
      const data = await getMissedBenefits({});
      setMissedSchemes(data.missed_schemes || []);
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in relative">
        
        {/* Header Section */}
        <div className="glass-card p-6 border border-primary/30 flex items-start gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-all duration-700"></div>
          
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-primary rounded-xl shadow-glow shadow-primary/30 relative z-10 shrink-0">
            <Zap className="text-white w-6 h-6 animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Missed Benefits Detector
            </h2>
            <p className="text-slate-300">
              PolicyGPT actively monitors your profile and has found these high-value schemes that you qualify for but haven't applied to.
            </p>
          </div>
        </div>

        {/* Missed Schemes List */}
        <div className="space-y-4 relative z-10">
          <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            You are also highly eligible for:
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-slate-800/50 h-40 rounded-xl border border-slate-700/50"></div>
              ))}
            </div>
          ) : missedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {missedSchemes.map((scheme, idx) => (
                <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <SchemeCard scheme={scheme} />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400 border border-slate-700/50">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No new missed benefits found right now. Keep your profile updated!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

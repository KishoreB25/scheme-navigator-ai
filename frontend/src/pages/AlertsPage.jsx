import { useState, useEffect } from 'react';
import { getMissedBenefits } from '../services/api';
import useProfile from '../hooks/useProfile';
import SchemeCard from '../components/schemes/SchemeCard';
import { Bell, Zap, BellRing, Sparkles } from 'lucide-react';

export default function AlertsPage() {
  const { profile } = useProfile();
  const [missedSchemes, setMissedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // Queries missed benefits with the actual active user profile, resolving the filtration bug
        const data = await getMissedBenefits(profile);
        setMissedSchemes(data.missed_schemes || []);
      } catch (err) {
        console.error('Failed to load missed benefits alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [profile]);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-transparent">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* Proactive Alerts Banner */}
        <div className="bg-surface/40 backdrop-blur-xl p-6 border-l-4 border-l-primary rounded-2xl shadow-2xl border border-border/80 flex items-start gap-5 transition-all duration-300">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex-shrink-0 text-primary shadow-glow select-none">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold font-display text-white mb-1.5 flex items-center gap-1.5">
              Missed Benefits Detector <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </h2>
            <p className="text-sm text-slate-350 leading-relaxed font-sans">
              Our background Alert Agent actively matches your active citizen profile against 50+ official government databases to surface high-value opportunities you qualify for but have not yet claimed.
            </p>
          </div>
        </div>

        {/* Missed Schemes Grid */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-primary shadow-glow animate-bounce" />
            Personalized Schemes Surfaced for You
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-surface/20 h-44 rounded-2xl border border-border/60"></div>
              ))}
            </div>
          ) : missedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {missedSchemes.map((scheme, idx) => (
                <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 0.15}s` }}>
                  <SchemeCard scheme={scheme} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface/30 backdrop-blur-xl p-12 text-center border border-border/80 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-900 border border-border rounded-2xl flex items-center justify-center text-slate-500 mb-4 select-none">
                <Bell className="w-6 h-6 opacity-45" />
              </div>
              <p className="text-sm text-slate-300 font-semibold mb-1">No missed benefits detected right now</p>
              <p className="text-xs text-slate-500 max-w-sm font-sans">
                Keep your profile updated! We will instantly notify you here if you become eligible for newly launched government directives.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { CheckSquare, Square, ExternalLink, Clock, Calendar, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function ApplicationGuide({ guide }) {
  const [checkedDocs, setCheckedDocs] = useState({});

  if (!guide) return null;

  const toggleDoc = (idx) => {
    setCheckedDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isStale = guide.freshness?.is_stale;
  const docsCount = guide.required_documents?.length || 0;
  const docsChecked = Object.values(checkedDocs).filter(Boolean).length;
  const progressPercent = docsCount > 0 ? (docsChecked / docsCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface/50 border border-border/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Est. Time</p>
            <p className="text-xs font-bold text-slate-200">{guide.estimated_time}</p>
          </div>
        </div>
        <div className="bg-surface/50 border border-border/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Deadline</p>
            <p className="text-xs font-bold text-slate-200">{guide.deadline_info}</p>
          </div>
        </div>
        <div className="bg-surface/50 border border-border/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Phone size={16} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Helpline</p>
            <p className="text-xs font-bold text-slate-200">{guide.helpline_number}</p>
          </div>
        </div>
        <div className={`border p-3 rounded-xl flex items-center gap-3 ${isStale ? 'bg-amber-500/10 border-amber-500/30' : 'bg-surface/50 border-border/60'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isStale ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700/50 text-slate-400'}`}>
            {isStale ? <AlertCircle size={16} /> : <RefreshCw size={16} />}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verification</p>
            <p className={`text-xs font-bold ${isStale ? 'text-amber-500' : 'text-slate-200'}`}>
              {isStale ? 'Needs Update' : 'Verified'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Documents */}
        <div className="bg-surface border border-border/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            Required Documents
            <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {docsChecked} / {docsCount}
            </span>
          </h3>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="space-y-2">
            {guide.required_documents?.map((doc, idx) => (
              <label 
                key={idx} 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  checkedDocs[idx] 
                    ? 'bg-primary/5 border-primary/30 text-slate-300' 
                    : 'bg-slate-900/50 border-border/50 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 text-primary shrink-0 transition-transform active:scale-90">
                  <input type="checkbox" className="hidden" checked={!!checkedDocs[idx]} onChange={() => toggleDoc(idx)} />
                  {checkedDocs[idx] ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-500" />}
                </div>
                <span className={`text-sm select-none ${checkedDocs[idx] ? 'line-through opacity-70' : ''}`}>
                  {doc}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Right Column: Steps */}
        <div className="bg-surface border border-border/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none"></div>
          
          <h3 className="text-sm font-bold text-white mb-5">Application Steps</h3>
          
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {guide.application_steps?.map((step, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6 last:pb-0">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-accent bg-accent/10 text-accent shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold text-xs">
                  {idx + 1}
                </div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-slate-900/50 border border-border/50 text-sm text-slate-300">
                  {step}
                </div>
              </div>
            ))}
          </div>
          
          {guide.official_link && (
            <div className="mt-6 pt-5 border-t border-border/50 text-center">
              <a 
                href={guide.official_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all shadow-glow-purple shadow-accent/20 cursor-pointer"
              >
                Apply on Official Website <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

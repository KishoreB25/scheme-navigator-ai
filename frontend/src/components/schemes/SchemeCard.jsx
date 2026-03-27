import { CheckCircle2, XCircle, Info, ExternalLink } from 'lucide-react';

export default function SchemeCard({ scheme }) {
  const isEligible = scheme.eligibility_status === true;

  return (
    <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700/60 rounded-xl p-5 hover:border-slate-500/50 transition-all shadow-glass hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-lg font-display font-semibold text-emerald-400">
          {scheme.name}
        </h3>
        
        {scheme.eligibility_status !== undefined && (
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 border border-slate-700/50 text-xs font-medium">
            {isEligible ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">Eligible</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500">Not Eligible</span>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-300 mt-2 line-clamp-2">
        {scheme.description || "A government initiative designed to provide financial independence and security to the beneficiaries."}
      </p>

      {/* Benefits Section */}
      {scheme.benefits && scheme.benefits.length > 0 && (
        <div className="mt-4 bg-slate-900/40 rounded-lg p-3 border border-slate-800/80">
          <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Key Benefits
          </h4>
          <ul className="text-sm text-slate-200 space-y-1.5 list-disc list-inside marker:text-primary pl-1">
            {scheme.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps & Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {scheme.steps && (
          <div className="text-xs text-slate-400 flex flex-col gap-1">
            <span className="font-medium text-slate-300 uppercase tracking-wide">How to apply:</span>
            <span>{scheme.steps}</span>
          </div>
        )}
        
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-medium rounded-lg shadow-glow shadow-emerald-500/25 transition-all w-full sm:w-auto mt-2 sm:mt-0 justify-center">
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

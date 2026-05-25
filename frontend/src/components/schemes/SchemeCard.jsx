import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

export default function SchemeCard({ scheme }) {
  const isEligible = scheme.eligible === true;
  const isPotential = scheme.eligibility_status?.toLowerCase().includes('potentially') || 
                      scheme.eligibility_status?.includes('⚠️') || 
                      scheme.eligibility_status?.toLowerCase().includes('info');

  return (
    <div className={`bg-surface/60 backdrop-blur-md rounded-2xl border transition-all duration-300 overflow-hidden relative group hover:-translate-y-0.5 ${
      isEligible 
        ? 'border-l-4 border-l-eligible border-border/50 hover:border-eligible/50 shadow-md hover:shadow-eligible/5' 
        : isPotential
        ? 'border-l-4 border-l-primary border-border/50 hover:border-primary/50 shadow-md hover:shadow-primary/5'
        : 'border-l-4 border-l-ineligible border-border/50 hover:border-ineligible/50 opacity-90'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-bold font-display text-white tracking-wide leading-tight group-hover:text-primary transition-colors duration-200">
              {scheme.name}
            </h3>
            {scheme.category && (
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full inline-block">
                {scheme.category}
              </span>
            )}
          </div>
          
          <span className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border tracking-wide select-none ${
            isEligible
              ? 'bg-eligible/10 text-eligible border-eligible/20'
              : isPotential
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-ineligible/10 text-ineligible border-ineligible/20'
          }`}>
            {isEligible ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Eligible</>
            ) : isPotential ? (
              <><AlertTriangle className="w-3.5 h-3.5" /> Needs Info</>
            ) : (
              <><XCircle className="w-3.5 h-3.5" /> Not Eligible</>
            )}
          </span>
        </div>

        {/* Description */}
        {scheme.description && (
          <p className="text-sm text-slate-300 mb-4 font-sans leading-relaxed">
            {scheme.description}
          </p>
        )}

        {/* Eligibility Reasons Breakdown */}
        {scheme.eligibility_reasons && scheme.eligibility_reasons.length > 0 && (
          <div className="mb-4 bg-background/50 rounded-xl p-4 border border-border/60 backdrop-blur-sm">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" /> Eligibility Breakdown
            </p>
            <div className="space-y-2">
              {scheme.eligibility_reasons.map((reason, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-2.5 leading-normal">
                  <span className="shrink-0 mt-0.5 text-[11px]">{reason.status}</span>
                  <span>
                    <strong className="text-slate-200 font-medium">{reason.criterion}:</strong>{' '}
                    <span className="text-slate-400">{reason.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Benefits */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-accent" /> Key Benefits
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-5 list-disc leading-normal font-sans">
              {scheme.benefits.slice(0, 4).map((benefit, i) => (
                <li key={i} className="marker:text-primary">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents Required */}
        {scheme.documents_required && scheme.documents_required.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" /> Documents Required
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scheme.documents_required.map((doc, idx) => (
                <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button & Citation */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
          {scheme.citation && (
            <p className="text-[10px] text-slate-500 italic select-none">
              {scheme.citation}
            </p>
          )}

          {scheme.official_link && (
            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/80 text-white text-xs font-semibold rounded-xl transition duration-200 shadow-glow-purple shadow-accent/15 cursor-pointer hover:shadow-accent/25 border border-accent/20"
            >
              Learn More <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

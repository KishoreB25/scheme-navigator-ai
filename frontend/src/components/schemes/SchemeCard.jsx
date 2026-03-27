import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink, FileText, ClipboardList } from 'lucide-react';

export default function SchemeCard({ scheme }) {
  const isEligible = scheme.eligible === true;
  const isPotential = scheme.eligibility_status?.includes('Potentially') || scheme.eligibility_status?.includes('⚠️');

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
      isEligible 
        ? 'border-l-4 border-l-green-500 border-gray-200' 
        : isPotential
        ? 'border-l-4 border-l-yellow-500 border-gray-200'
        : 'border-l-4 border-l-red-400 border-gray-200 opacity-85'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <h3 className="text-base font-bold text-gray-800">{scheme.name}</h3>
            {scheme.category && (
              <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                {scheme.category}
              </span>
            )}
          </div>
          
          <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 ${
            isEligible
              ? 'bg-green-100 text-green-700'
              : isPotential
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
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
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scheme.description}</p>
        )}

        {/* Eligibility Reasons */}
        {scheme.eligibility_reasons && scheme.eligibility_reasons.length > 0 && (
          <div className="mb-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Eligibility Breakdown:</p>
            <div className="space-y-1">
              {scheme.eligibility_reasons.map((reason, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">{reason.status}</span>
                  <span><strong>{reason.criterion}:</strong> {reason.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" /> Key Benefits
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-1">
              {scheme.benefits.slice(0, 4).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply Button & Citation */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {scheme.citation && (
            <p className="text-[10px] text-gray-400 italic">{scheme.citation}</p>
          )}

          {scheme.official_link && (
            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
            >
              Learn More <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

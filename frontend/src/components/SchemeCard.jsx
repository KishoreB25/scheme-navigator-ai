export default function SchemeCard({ scheme, onApply }) {
  const { id, name, eligibility, benefits, apply_steps, apply_link } = scheme;

  const isEligible = eligibility?.eligible !== false;

  return (
    <div className={`bg-white rounded-lg p-5 hover:shadow-md transition-all border-l-4 ${
      isEligible 
        ? 'border-l-green-500' 
        : 'border-l-red-500 opacity-75'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-gray-800 flex-1">{name}</h4>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          isEligible
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {isEligible ? '✓ Eligible' : '✗ Not Eligible'}
        </span>
      </div>

      {eligibility?.reason && (
        <p className="text-xs text-gray-600 mb-3 italic">{eligibility.reason}</p>
      )}

      {/* Benefits */}
      {benefits && (
        <div className="mb-4 text-sm">
          <p className="font-semibold text-gray-700 mb-2">Benefits:</p>
          <p className="text-gray-600 leading-relaxed">{benefits}</p>
        </div>
      )}

      {/* Application Steps */}
      {apply_steps && (
        <div className="mb-4 text-sm">
          <p className="font-semibold text-gray-700 mb-2">Steps to Apply:</p>
          <ol className="list-decimal list-inside text-gray-600 space-y-1">
            {apply_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Apply Button */}
      {isEligible && apply_link && (
        <div className="mt-4">
          <a
            href={apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition font-semibold text-sm"
          >
            Apply Now →
          </a>
        </div>
      )}

      {!isEligible && (
        <p className="text-xs text-gray-500 italic mt-4">
          You may not be eligible for this scheme based on current criteria.
        </p>
      )}
    </div>
  );
}

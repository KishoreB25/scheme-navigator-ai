export default function SchemeCard({ scheme, onApply }) {
  const { id, name, eligibility, benefits, apply_steps, apply_link } = scheme;

  const isEligible = eligibility?.eligible !== false;

  return (
    <div className={`border-2 rounded-lg p-4 ${
      isEligible 
        ? 'border-green-300 bg-green-50' 
        : 'border-red-300 bg-red-50'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800 flex-1">{name}</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded ${
          isEligible
            ? 'bg-eligible text-white'
            : 'bg-ineligible text-white'
        }`}>
          {isEligible ? '✓ Eligible' : '✗ Not Eligible'}
        </span>
      </div>

      {eligibility?.reason && (
        <p className="text-xs text-gray-600 mb-2 italic">{eligibility.reason}</p>
      )}

      {/* Benefits */}
      {benefits && (
        <div className="mb-3 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Benefits:</p>
          <p className="text-gray-600">{benefits}</p>
        </div>
      )}

      {/* Application Steps */}
      {apply_steps && (
        <div className="mb-3 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Steps to Apply:</p>
          <ol className="list-decimal list-inside text-gray-600 space-y-1">
            {apply_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Apply Button */}
      {isEligible && apply_link && (
        <div className="mt-3">
          <a
            href={apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-eligible text-white px-3 py-2 rounded-lg hover:bg-opacity-90 transition font-semibold text-sm"
          >
            Apply Now →
          </a>
        </div>
      )}

      {!isEligible && (
        <p className="text-xs text-gray-500 italic mt-3">
          You may not be eligible for this scheme based on current criteria.
        </p>
      )}
    </div>
  );
}

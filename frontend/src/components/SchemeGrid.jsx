import SchemeCard from './SchemeCard';

export default function SchemeGrid({ schemes = [] }) {
  if (!schemes || schemes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No schemes available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schemes.map((scheme) => (
        <SchemeCard key={scheme.id} scheme={scheme} />
      ))}
    </div>
  );
}

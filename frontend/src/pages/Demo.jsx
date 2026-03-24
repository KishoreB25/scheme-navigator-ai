import ChatInterface from '../components/ChatInterface';

export default function Demo() {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-80px)]">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-saffron mb-2">PolicyGPT Bharat Demo</h1>
        <p className="text-gray-600 text-lg">
          Try the quick demo flow: Voice input → Eligibility check → Discover missed schemes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-bharat-blue rounded">
          <h2 className="font-bold text-bharat-blue mb-2">Quick Demo Instructions:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Click the <span className="font-mono text-red-600">🎤 Record Voice</span> button</li>
            <li>Say: "I'm a 35-year-old farmer from Maharashtra with an annual income of 2 lakhs"</li>
            <li>System will show eligible schemes</li>
            <li>Click <span className="font-mono">Find Missed Benefits</span> to discover more</li>
          </ul>
        </div>

        <ChatInterface demoMode={true} />
      </div>
    </div>
  );
}

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
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* Header Section */}
        <div className="bg-white p-6 border-l-4 border-l-blue-600 rounded-lg shadow-sm border border-gray-200 flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
            <Zap className="text-blue-600 w-6 h-6" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Missed Benefits Detector
            </h2>
            <p className="text-gray-600">
              PolicyGPT actively monitors your profile and has found these high-value schemes that you qualify for but haven't applied to.
            </p>
          </div>
        </div>

        {/* Missed Schemes List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            You are also highly eligible for:
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 h-40 rounded-lg border border-gray-300"></div>
              ))}
            </div>
          ) : missedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {missedSchemes.map((scheme, idx) => (
                <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <SchemeCard scheme={scheme} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 text-center text-gray-500 border border-gray-200 rounded-lg shadow-sm">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No new missed benefits found right now. Keep your profile updated!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

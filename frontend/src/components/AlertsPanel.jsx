import { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';
import { X } from 'lucide-react';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAlerts();
      setAlerts(response.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8 animate-pulse">Loading alerts...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg">No new alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><span className="mr-2">🔔</span>Recent Updates</h3>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border-l-4 flex justify-between items-start bg-white transition-all hover:shadow-md ${
            alert.type === 'new'
              ? 'border-l-blue-500'
              : alert.type === 'update'
              ? 'border-l-yellow-500'
              : 'border-l-green-500'
          }`}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{alert.message}</p>
            <p className="text-xs text-gray-600 mt-2">
              {new Date(alert.timestamp).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="text-gray-400 hover:text-gray-600 transition ml-4"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

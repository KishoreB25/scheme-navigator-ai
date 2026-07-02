import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ApplicationGuide from '../components/schemes/ApplicationGuide';
import { API_BASE_URL } from '../services/api';

export default function GuidePage() {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true);
        // We add the endpoint to api service directly or call it via fetch
        const response = await fetch(`${API_BASE_URL}/schemes/${schemeId}/guide`);
        if (!response.ok) {
          throw new Error('Failed to fetch guide details');
        }
        const data = await response.json();
        setGuide(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [schemeId]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-400 font-sans tracking-wide">Loading application guide...</p>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Guide Not Found</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error || "The application guide for this scheme could not be loaded."}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-surface hover:bg-surface/80 text-white font-semibold rounded-xl border border-border/50 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="bg-surface/30 backdrop-blur-md rounded-3xl border border-border/60 overflow-hidden shadow-2xl">
        <div className="p-8 md:p-10 border-b border-border/60 bg-gradient-to-r from-primary/10 via-surface/5 to-transparent relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none blur-3xl"></div>
          
          <div className="relative z-10 space-y-4">
            {guide.category && (
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full inline-block">
                {guide.category}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-display leading-tight">
              {guide.scheme_name}
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
              {guide.description}
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <ApplicationGuide guide={guide} />
        </div>
      </div>
    </div>
  );
}

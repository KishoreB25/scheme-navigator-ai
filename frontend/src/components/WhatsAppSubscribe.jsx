import { useState } from 'react';
import { Phone, CheckCircle2, XCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function WhatsAppSubscribe({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [phone, setPhone] = useState('');
  const [alertPreferences, setAlertPreferences] = useState({
    new_schemes: true,
    deadline_reminders: true,
    eligibility_changes: false
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Join Sandbox, 2: Subscribe Form

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setStatus('error');
      setMessage('Please enter a valid phone number');
      return;
    }

    setStatus('loading');
    
    try {
      const API_BASE = 'http://localhost:8000';
      
      const selectedTypes = Object.entries(alertPreferences)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      const response = await fetch(`${API_BASE}/alerts/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          user_id: user?.uid || null,
          alert_types: selectedTypes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      setMessage('Successfully subscribed to WhatsApp alerts!');
      
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
        setStep(1); // Reset step
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage('Error connecting to server. Please try again.');
    }
  };

  const togglePreference = (key) => {
    setAlertPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sandboxLink = 'https://wa.me/14155238886?text=join%20statement-met';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sandboxLink)}&color=10b981&bgcolor=0f172a`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up relative">
        
        {/* Header */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">WhatsApp Alerts</h2>
              <p className="text-xs text-emerald-400">Step {step} of 2 • Twilio Sandbox</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6 text-center">
              <div className="text-left">
                <h3 className="text-sm font-bold text-white mb-1">Step 1: Connect to Sandbox</h3>
                <p className="text-xs text-slate-400">
                  Because this is a test environment, you must opt-in to the Twilio sandbox to receive messages on your phone.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="mx-auto w-[180px] h-[180px] bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to Join Sandbox" 
                  className="w-[150px] h-[150px] rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Scan the QR code with your phone camera, or click the button below to open WhatsApp:
                </p>
                <a
                  href={sandboxLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold py-2.5 px-4 rounded-xl border border-emerald-500/20 transition-all text-sm gap-2"
                >
                  Join Sandbox Chat
                </a>
                <p className="text-[11px] text-slate-500">
                  Make sure to send the pre-filled text: <code className="text-emerald-400 font-mono bg-slate-950 px-1 py-0.5 rounded">join statement-met</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-glow shadow-emerald-500/20 active:scale-[0.98]"
              >
                I've Joined, Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-left">
                <h3 className="text-sm font-bold text-white mb-1">Step 2: Subscribe to Alerts</h3>
                <p className="text-xs text-slate-400">
                  Enter your phone number to register for automated government scheme notifications.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      +91
                    </span>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Alert Preferences
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-950 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={alertPreferences.new_schemes}
                        onChange={() => togglePreference('new_schemes')}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-sm text-slate-200">New Schemes for my profile</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-950 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={alertPreferences.deadline_reminders}
                        onChange={() => togglePreference('deadline_reminders')}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-sm text-slate-200">Approaching Deadlines</span>
                    </label>
                  </div>
                </div>

                {/* Status Message */}
                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} /> {message}
                  </div>
                )}
                {status === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} /> {message}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-glow shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <><Loader2 size={18} className="animate-spin" /> Subscribing...</>
                    ) : status === 'success' ? (
                      <><CheckCircle2 size={18} /> Subscribed</>
                    ) : (
                      'Subscribe to Alerts'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { MessageSquare, User, Bell, Phone, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { languages } from '../../i18n/translations';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  const navItems = [
    { name: t('chatAssistant'), path: '/chat', icon: MessageSquare },
    { name: t('userProfile'), path: '/profile', icon: User },
    { name: t('missedBenefits'), path: '/alerts', icon: Bell },
  ];

  return (
    <aside className="w-64 h-full flex flex-col bg-surface/30 backdrop-blur-xl border-r border-border/80 z-20 flex-shrink-0">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-border/80 bg-surface/10">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg font-display shadow-glow">
          PS
        </div>
        <h1 className="text-xl font-bold font-display tracking-widest text-white">
          Policy<span className="text-primary font-medium">Setu</span>
        </h1>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-b border-border/80 bg-surface/20">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-primary/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-2 relative">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-glow shadow-primary/10 border-primary/30'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-surface/40 hover:border-border/60'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm tracking-wide">{item.name}</span>
          </NavLink>
        ))}

        {/* Decorative Divider */}
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"></div>

        {/* WhatsApp Demo Integration Button */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 group">
          <Phone className="w-5 h-5 shrink-0 group-hover:animate-pulse" />
          <span className="font-medium text-sm tracking-wide">{t('whatsappDemo')}</span>
        </button>

        {/* Language Selector */}
        <div className="mt-auto mb-2 flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-surface/20">
          <Globe className="w-5 h-5 shrink-0 text-slate-400" />
          <select 
            value={locale} 
            onChange={(e) => setLocale(e.target.value)}
            className="bg-transparent text-sm tracking-wide font-medium text-slate-300 focus:outline-none w-full cursor-pointer appearance-none"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-background text-white">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Logout Button - shown only when user is logged in */}
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm tracking-wide">{t('logout')}</span>
          </button>
        )}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border/80 bg-surface/10 text-[10px] text-slate-500 text-center tracking-wider">
        v1.0 • Built with 🧡 for Bharat
      </div>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import { MessageSquare, User, Bell, Phone } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Chat Assistant', path: '/chat', icon: MessageSquare },
    { name: 'User Profile', path: '/profile', icon: User },
    { name: 'Missed Benefits', path: '/alerts', icon: Bell },
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

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-2 relative">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
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
        <button className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 group">
          <Phone className="w-5 h-5 shrink-0 group-hover:animate-pulse" />
          <span className="font-medium text-sm tracking-wide">WhatsApp Demo</span>
        </button>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border/80 bg-surface/10 text-[10px] text-slate-500 text-center tracking-wider">
        v1.0 • Built with 🧡 for Bharat
      </div>
    </aside>
  );
}

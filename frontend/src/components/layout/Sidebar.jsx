import { NavLink } from 'react-router-dom';
import { MessageSquare, User, Bell, Phone } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ];

  return (
    <aside className="w-64 h-full flex flex-col bg-white z-20 border-r border-gray-200 flex-shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
          P
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          PolicyGPT
        </h1>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-2 relative">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary/20 text-primary shadow-glow shadow-primary/20 border border-primary/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}

        {/* Decorative Divider */}
        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

        <button className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 group">
          <Phone className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-medium">WhatsApp Demo</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-slate-800/50 text-xs text-slate-500 text-center">
        v1.0 • Built with 🧡 for Bharat
      </div>
    </aside>
  );
}

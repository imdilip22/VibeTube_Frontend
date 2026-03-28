import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";

export const TopBar = ({ title = "VibeTube" }: { title?: string }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0a0a12]/90 backdrop-blur-xl border-b border-white/5">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">V</span>
        </div>
        <span className="text-white font-semibold text-base tracking-tight">{title}</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link to="/search" className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <Search size={18} className="text-gray-400" />
        </Link>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors relative">
          <Bell size={18} className="text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500" />
        </button>
      </div>
    </header>
  );
};

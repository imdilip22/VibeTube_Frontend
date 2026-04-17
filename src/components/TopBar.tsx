import { Link, useNavigate } from "react-router-dom";
import { Search, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "V";

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-between items-center px-5 h-16 border-b border-white/5">
      {/* Left — menu + logo */}
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:opacity-80 active:scale-95 transition-all">
          <Menu size={22} />
        </button>
        <Link to="/" className="text-2xl font-black text-[#3fff81] uppercase tracking-tighter select-none">
          VibeTube
        </Link>
      </div>

      {/* Right — search + avatar */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate("/search")}
          className="text-gray-400 hover:opacity-80 active:scale-95 transition-all"
        >
          <Search size={20} />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate("/profile")}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3fff81]/80 to-[#00c458] flex items-center justify-center text-[#0e0e0e] text-xs font-black border border-white/10 overflow-hidden hover:opacity-80 transition-opacity"
        >
          {initials}
        </button>
      </div>
    </nav>
  );
};

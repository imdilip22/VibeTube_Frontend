import { Link, useLocation } from "react-router-dom";
import { Home, Users, Library, User, Radio } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Users, label: "Subscriptions", path: "/subscriptions" },
  { icon: Radio, label: "Live", path: "/live" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d18]/95 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-violet-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

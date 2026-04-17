import { Link, useLocation } from "react-router-dom";
import { Home, Library, User, Radio, Users } from "lucide-react";

const navItems = [
  { icon: Home,    label: "Home",          path: "/" },
  { icon: Users,   label: "Subscriptions", path: "/channels" },
  { icon: Radio,   label: "Live",          path: "/live" },
  { icon: Library, label: "Library",       path: "/library" },
  { icon: User,    label: "Profile",       path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-[#0e0e0e]/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-8px_32px_rgba(0,0,0,0.3)] flex justify-around items-center pt-3 pb-6 px-4">
      {navItems.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              isActive
                ? "text-[#3fff81] scale-110"
                : "text-[#767575] hover:text-[#3fff81] active:translate-y-[-2px]"
            }`}
          >
            <item.icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.5}
              fill={isActive ? "currentColor" : "none"}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

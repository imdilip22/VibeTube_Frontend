import { Link, useLocation } from "react-router-dom";
import { Home, Library, User, Radio, Users } from "lucide-react";

const navItems = [
  { icon: Home,    label: "Home",   path: "/" },
  { icon: Users,   label: "Subs",   path: "/channels" },
  { icon: Radio,   label: "Live",   path: "/live" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: User,    label: "Profile", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="glass fixed bottom-0 w-full z-50 flex lg:hidden justify-around items-center pt-3 pb-5 px-2"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderRadius: "16px 16px 0 0",
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            id={`nav-${item.label.toLowerCase()}`}
            className="nav-item"
            style={isActive ? { color: "var(--primary)" } : {}}
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}

            <item.icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.6}
              fill={isActive ? "currentColor" : "none"}
            />

            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{
                fontFamily: "var(--font-body)",
                color: isActive ? "var(--primary)" : "var(--outline)",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

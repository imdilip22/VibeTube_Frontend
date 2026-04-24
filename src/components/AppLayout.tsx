import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  /** Set true on pages that should NOT have the standard padded main wrapper (e.g. WatchPage) */
  fullBleed?: boolean;
}

/**
 * Shared responsive shell:
 * - Mobile  (<lg): fixed TopBar at top + BottomNav at bottom
 * - Desktop (≥lg): fixed left SideNav (240px) + sticky top-bar strip at top right
 */
export const AppLayout = ({ children, fullBleed = false }: AppLayoutProps) => {
  return (
    <div
      className="min-h-dvh"
      style={{ background: "var(--surface)" }}
    >
      {/* ── Global Top Bar ────────────────────────────────────────── */}
      <TopBar />

      {/* ── Desktop left sidebar ───────────────────────────────────── */}
      <SideNav />

      {/* ── Main content area ─────────────────────────────────────── */}
      <div
        className={
          fullBleed
            ? "lg:ml-[240px] pt-16 pb-20 lg:pb-0"
            : "lg:ml-[240px] pt-16 pb-24 lg:pb-8"
        }
      >


        {fullBleed ? (
          children
        ) : (
          <div className={fullBleed ? "" : "px-4 lg:px-8 xl:px-12"}>
            {children}
          </div>
        )}
      </div>

      {/* ── Mobile bottom nav (hidden on lg+) ──────────────────────── */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SideNav } from "./components/SideNav";
import { TopBar } from "./components/TopBar";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { WatchPage } from "./pages/WatchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { UploadPage } from "./pages/UploadPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { ChannelPage } from "./pages/ChannelPage";
import { ChannelsPage } from "./pages/ChannelsPage";
import { GoLivePage } from "./pages/GoLivePage";
import { WatchLivePage } from "./pages/WatchLivePage";
import { LiveStreamsPage } from "./pages/LiveStreamsPage";
import { GoogleCallbackPage } from "./pages/GoogleCallbackPage";

/**
 * AppShell renders the persistent SideNav for desktop (lg+).
 * On mobile, each page already renders <TopBar /> + <BottomNav />.
 * SideNav is hidden on mobile via `hidden lg:flex` in its own component.
 */
const AppShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <TopBar />
    <SideNav />
    {children}
  </>
);

// AuthProvider requires Router context (uses useNavigate/useLocation internally)
// so it must live INSIDE <BrowserRouter>.
const App = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<GoogleCallbackPage />} />

            {/* Protected — all wrapped in AppShell for SideNav */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell><HomePage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/watch/:id" element={
              <ProtectedRoute>
                <AppShell><WatchPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <AppShell><LibraryPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppShell><ProfilePage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <AppShell><EditProfilePage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <AppShell><SearchPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <AppShell><UploadPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <AppShell><SubscriptionsPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/channels" element={
              <ProtectedRoute>
                <AppShell><ChannelsPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/channel/:email" element={
              <ProtectedRoute>
                <AppShell><ChannelPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/live" element={
              <ProtectedRoute>
                <AppShell><LiveStreamsPage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/live/go" element={
              <ProtectedRoute>
                <AppShell><GoLivePage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/live/watch/:streamKey" element={
              <ProtectedRoute>
                <AppShell><WatchLivePage /></AppShell>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;

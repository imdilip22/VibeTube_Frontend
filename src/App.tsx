import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { WatchPage } from "./pages/WatchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { UploadPage } from "./pages/UploadPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { ChannelPage } from "./pages/ChannelPage";
import { ChannelsPage } from "./pages/ChannelsPage";
import { GoLivePage } from "./pages/GoLivePage";
import { WatchLivePage } from "./pages/WatchLivePage";
import { LiveStreamsPage } from "./pages/LiveStreamsPage";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/watch/:id" element={<ProtectedRoute><WatchPage /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
            <Route path="/channel/:email" element={<ProtectedRoute><ChannelPage /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LiveStreamsPage /></ProtectedRoute>} />
            <Route path="/live/go" element={<ProtectedRoute><GoLivePage /></ProtectedRoute>} />
            <Route path="/live/watch/:streamKey" element={<ProtectedRoute><WatchLivePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/useAuth.js";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CreatePollPage from "./pages/CreatePollPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PublicPollPage from "./pages/PublicPollPage.jsx";

export default function App() {
  const { booting } = useAuth();

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="mark">PB</div>
        <p>Loading PulseBoard...</p>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/p/:publicId" element={<PublicPollPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/polls/new" element={<CreatePollPage />} />
          <Route path="/polls/:pollId/analytics" element={<AnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

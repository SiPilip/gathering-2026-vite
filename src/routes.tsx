import { Routes, Route, BrowserRouter } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/public/LandingPage";
import RegistrationPage from "./pages/public/RegistrationPage";
import RegistrationSuccess from "./pages/public/RegistrationSuccess";
import StatusCheckPage from "./pages/public/StatusCheckPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminNewRegistration from "./pages/admin/AdminNewRegistration";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/success/:id" element={<RegistrationSuccess />} />
          <Route path="/status" element={<StatusCheckPage />} />
          <Route path="/status/:id" element={<StatusCheckPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="registrations/new" element={<AdminNewRegistration />} />
          <Route path="payments/:id" element={<AdminPayments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { Routes, Route, BrowserRouter } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/public/LandingPage";
import RegistrationPage from "./pages/public/RegistrationPage";
import RegistrationSuccess from "./pages/public/RegistrationSuccess";
import StatusCheckPage from "./pages/public/StatusCheckPage";
import CheckTransport from "./pages/CheckTransport";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminNewRegistration from "./pages/admin/AdminNewRegistration";
import AdminEditRegistration from "./pages/admin/AdminEditRegistration";
import AdminParticipantList from "./pages/admin/AdminParticipantList";
import AdminDonors from "./pages/admin/AdminDonors";
import AdminTransport from "./pages/admin/AdminTransport";
import AdminRooms from "./pages/admin/AdminRooms";
import CheckRoom from "./pages/CheckRoom";

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
          <Route path="/transport" element={<CheckTransport />} />
          <Route path="/room" element={<CheckRoom />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="registrations/new" element={<AdminNewRegistration />} />
          <Route path="registrations/:id/edit" element={<AdminEditRegistration />} />
          <Route path="participants" element={<AdminParticipantList />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="transport" element={<AdminTransport />} />
          <Route path="payments/:id" element={<AdminPayments />} />
          <Route path="room" element={<AdminRooms />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

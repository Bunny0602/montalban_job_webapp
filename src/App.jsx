import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import EmailActionHandler from "./pages/auth/EmailActionHandler";
import InvalidAction from "./pages/auth/InvalidAction";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import AdminDashboard from "./pages/admin/Dashboard";
import JobSeekerDashboard from "./pages/JobSeeker/Dashboard";
import EmployerDashboard from "./pages/employer/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Firebase Email Action Handler - Main entry point for Firebase email links */}
        <Route path="/auth-action" element={<EmailActionHandler />} />
        
        {/* Email verification and password reset - Called by EmailActionHandler */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/action" element={<ResetPassword />} />
        
        {/* Error handling */}
        <Route path="/invalid-action" element={<InvalidAction />} />
        
        {/* Forgot password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Dashboards */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/jobseeker-dashboard" element={<JobSeekerDashboard />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

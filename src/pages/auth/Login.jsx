import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");

      // Step 1: Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User signed in:", user.uid);

      // Step 2: Fetch user document from Firestore to get role
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError("❌ User profile not found. Please contact support.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "job_seeker"; // Default to job_seeker if no role

      console.log("User data:", userData);
      console.log("User role:", userRole);
      console.log("Email verified:", user.emailVerified);

      // Step 3: Apply email verification logic based on role
      // ADMIN BYPASS: Admins don't need email verification
      if (userRole === "admin") {
        console.log("Admin login - skipping email verification");
        
        // Prepare admin data for dashboard
        const dashboardData = {
          email: userData.email || user.email,
          role: userRole,
          emailVerified: user.emailVerified,
          uid: user.uid,
          profile: {
            fullName: userData.fullName || "Admin User",
            firstName: userData.fullName?.split(' ')[0] || "Admin",
          }
        };

        setSuccessData({
          userRole: userRole,
          dashboardData: dashboardData
        });
        setShowSuccess(true);
        setLoading(false);
        return;
      }

      // NON-ADMIN VERIFICATION: Employers and job seekers must verify email
      if (!user.emailVerified) {
        console.log("Email not verified for non-admin user");
        setError("Email not verified!\n\nPlease verify your email before logging in.\n\nCheck your inbox for the verification link.");
        
        // Optional: Send verification email again
        try {
          await user.sendEmailVerification();
          console.log("Verification email resent");
        } catch (verifyErr) {
          console.warn("Could not send verification email:", verifyErr);
        }
        
        setLoading(false);
        return;
      }

      console.log("Email verified - User can login");

      // Step 4: Prepare dashboard data based on role
      let dashboardData = {
        email: userData.email || user.email,
        role: userRole,
        emailVerified: user.emailVerified,
        uid: user.uid,
      };

      // Add role-specific profile data
      if (userRole === "job_seeker") {
        dashboardData.profile = {
          fullName: userData.fullName || "",
          firstName: userData.fullName?.split(' ')[0] || "",
          age: userData.age || "",
          gender: userData.gender || "",
          barangay: userData.barangay || "",
          address: userData.address || "",
          desiredJob: userData.desiredJob || "",
          skills: userData.skills || "",
          experience: userData.experience || "",
          education: userData.education || "",
          contactNumber: userData.contactNumber || "",
        };
      } else if (userRole === "employer") {
        dashboardData.profile = {
          fullName: userData.companyName || "",
          firstName: userData.contactPerson?.split(' ')[0] || "",
          companyName: userData.companyName || "",
          contactPerson: userData.contactPerson || "",
          barangay: userData.barangay || "",
          address: userData.address || "",
          contactNumber: userData.contactNumber || "",
          positionHiringFor: userData.positionHiringFor || "",
          jobDescription: userData.jobDescription || "",
        };
      } else if (userRole === "admin") {
        dashboardData.profile = {
          fullName: userData.fullName || "Admin User",
          firstName: userData.fullName?.split(' ')[0] || "Admin",
        };
      }

      setSuccessData({
        userRole: userRole,
        dashboardData: dashboardData
      });
      setShowSuccess(true);
      setLoading(false);

    } catch (err) {
      console.error("Login error:", err);
      
      if (err?.code === "auth/user-not-found") {
        setError("❌ Email not found. Please register first.");
      } else if (err?.code === "auth/wrong-password") {
        setError("❌ Incorrect password. Please try again.");
      } else if (err?.code === "auth/invalid-email") {
        setError("❌ Invalid email address.");
      } else if (err?.code === "auth/user-disabled") {
        setError("❌ This account has been disabled.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("❌ Too many login attempts. Please try again later.");
      } else {
        setError(err?.message || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleSuccessRedirect = () => {
    const userRole = successData.userRole;
    const dashboardData = successData.dashboardData;
    setShowSuccess(false);
    
    // Step 4: Redirect based on role
    if (userRole === "admin") {
      console.log("Redirecting to admin dashboard");
      navigate("/admin-dashboard", { replace: true, state: dashboardData });
    } else if (userRole === "job_seeker") {
      console.log("Redirecting to jobseeker dashboard");
      navigate("/jobseeker-dashboard", { replace: true, state: dashboardData });
    } else if (userRole === "employer") {
      console.log("Redirecting to employer dashboard");
      navigate("/employer-dashboard", { replace: true, state: dashboardData });
    } else {
      console.log("Unknown role, redirecting to home");
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="login-page">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #fff;
        }

        .login-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .sidebar {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          animation: slideInLeft .6s ease-out;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sidebar-content h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 24px;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .sidebar-content p {
          font-size: 16px;
          margin-bottom: 40px;
          opacity: 0.95;
          line-height: 1.7;
          max-width: 480px;
        }

        .sidebar-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 40px;
          width: 100%;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          font-size: 15px;
          opacity: 0.95;
          line-height: 1.5;
        }

        .feature-icon {
          font-size: 28px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-text {
          flex: 1;
        }

        .feature-title {
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
        }

        .feature-desc {
          font-size: 13px;
          opacity: 0.85;
        }

        .content-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #fff;
          animation: slideInRight .6s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .card {
          background: #fff;
          border-radius: 16px;
          padding: 48px;
          width: 100%;
          max-width: 420px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .brand {
          font-weight: 700;
          font-size: 16px;
          color: #0d6efd;
        }

        .login-title {
          font-weight: 700;
          font-size: 28px;
          color: #222;
          margin-bottom: 12px;
          text-align: center;
        }

        .login-subtitle {
          font-size: 14px;
          color: #6c757d;
          text-align: center;
          margin-bottom: 28px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #222;
          margin-bottom: 8px;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e9ecef;
          border-radius: 10px;
          font-size: 14px;
          transition: all .2s;
          background: #f8f9fa;
        }

        .form-input:focus {
          outline: none;
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          background: #fff;
        }

        .form-input::placeholder {
          color: #adb5bd;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #6c757d;
          transition: color .2s;
          padding: 4px;
        }

        .password-toggle:hover {
          color: #0d6efd;
        }

        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          border-left: 4px solid #dc3545;
          white-space: pre-wrap;
          line-height: 1.5;
          animation: slideDown .3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-login {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform .12s, box-shadow .12s;
          margin-top: 12px;
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(13, 110, 253, 0.2);
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .login-footer-text {
          font-size: 13px;
          color: #6c757d;
        }

        .login-footer-link {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 600;
          transition: color .2s;
        }

        .login-footer-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn .3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .success-modal {
          background: #fff;
          border-radius: 16px;
          padding: 40px;
          max-width: 450px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp .4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #28a745, #20c997);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          margin: 0 auto 24px;
          animation: scaleIn .5s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: #fff;
          font-weight: bold;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .success-title {
          font-size: 28px;
          font-weight: 700;
          color: #222;
          margin-bottom: 12px;
        }

        .success-subtitle {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .success-badge {
          display: inline-block;
          background: #d4edda;
          color: #155724;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .success-badge.admin {
          background: #d4edda;
          color: #155724;
        }

        .btn-continue {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform .12s, box-shadow .12s;
        }

        .btn-continue:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(40, 167, 69, 0.2);
        }

        .btn-continue:active {
          transform: translateY(-1px);
        }

        .btn-continue.admin {
          background: linear-gradient(135deg, #28a745, #20c997);
        }

        .btn-continue.admin:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(40, 167, 69, 0.2);
        }

        @media (max-width: 1024px) {
          .sidebar {
            flex: 0.9;
            padding: 50px 40px;
          }

          .sidebar-content h1 {
            font-size: 40px;
          }

          .sidebar-content p {
            font-size: 15px;
          }

          .card {
            padding: 40px;
            max-width: 380px;
          }

          .content-area {
            padding: 30px;
          }
        }

        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
          }

          .sidebar {
            padding: 40px 30px;
            text-align: center;
            justify-content: flex-start;
            padding-top: 40px;
            flex: auto;
          }

          .sidebar-content h1 {
            font-size: 32px;
          }

          .sidebar-content p {
            margin: 16px auto;
            max-width: 100%;
            font-size: 14px;
          }

          .sidebar-features {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 30px;
            width: 100%;
          }

          .feature-item {
            flex: 0 1 calc(50% - 8px);
            text-align: center;
            align-items: center;
            flex-direction: column;
          }

          .feature-icon {
            font-size: 32px;
          }

          .feature-text {
            text-align: center;
          }

          .content-area {
            padding: 20px;
            flex: 1;
          }

          .card {
            padding: 32px;
            max-width: 100%;
          }

          .login-title {
            font-size: 24px;
          }

          .success-modal {
            padding: 32px;
          }

          .success-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            padding: 30px 20px;
          }

          .sidebar-content h1 {
            font-size: 26px;
            margin-bottom: 16px;
          }

          .sidebar-content p {
            font-size: 13px;
            margin-bottom: 24px;
          }

          .content-area {
            padding: 16px;
          }

          .card {
            padding: 24px;
            border-radius: 12px;
          }

          .logo {
            margin-bottom: 24px;
          }

          .login-title {
            font-size: 22px;
            margin-bottom: 8px;
          }

          .login-subtitle {
            font-size: 12px;
            margin-bottom: 20px;
          }

          .form-group {
            margin-bottom: 14px;
          }

          .sidebar-features {
            gap: 12px;
            margin-top: 20px;
          }

          .feature-item {
            flex: 1;
            font-size: 12px;
          }

          .feature-icon {
            font-size: 24px;
          }

          .success-modal {
            padding: 24px;
          }

          .success-title {
            font-size: 20px;
          }

          .success-icon {
            width: 70px;
            height: 70px;
            font-size: 40px;
          }
        }
      `}</style>

      {/* SUCCESS MODAL */}
      {showSuccess && successData && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <div className={`success-badge ${successData.userRole === "admin" ? "admin" : ""}`}>
              {successData.userRole === "admin" ? "ADMIN ACCESS" : "VERIFIED"}
            </div>
            <h2 className="success-title">
              {successData.userRole === "admin" ? "Admin Login Successful!" : "Login Successful!"}
            </h2>
            <p className="success-subtitle">
              {successData.userRole === "admin" 
                ? "Welcome to the admin panel. You have full access."
                : "Welcome back! Your email has been verified and you're ready to go."}
            </p>

            <button 
              className={`btn-continue ${successData.userRole === "admin" ? "admin" : ""}`}
              onClick={handleSuccessRedirect}
            >
              Continue to Dashboard →
            </button>
          </div>
        </div>
      )}

      <div className="login-wrapper">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-content">
            <h1>Welcome Back!</h1>
            <p>Sign in to access your job opportunities, manage candidates.</p>
            
            <div className="sidebar-features">
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <span className="feature-title">Secure Login</span>
                  <span className="feature-desc">Your data is protected with encryption</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">
                  <span className="feature-title">Quick Access</span>
                  <span className="feature-desc">Instant access to all your features</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📱</div>
                <div className="feature-text">
                  <span className="feature-title">Mobile Ready</span>
                  <span className="feature-desc">Works seamlessly on all devices</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="content-area">
          <main className="card" role="main">
            <div className="logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.3V12.5Z" fill="white"/>
              </svg>
              <div className="brand">Montalban Jobs</div>
            </div>

            <h2 className="login-title">Login</h2>
            <p className="login-subtitle">Enter your credentials to continue</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label className="form-label">Password</label>
                  <a href="/forgot-password" style={{ fontSize: "13px", color: "#0d6efd", textDecoration: "none", fontWeight: "600" }}>
                    Forgot password?
                  </a>
                </div>
                <div className="form-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "🔓" : "🔒"}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="login-footer">
              <p className="login-footer-text">
              </p>
              <p className="login-footer-text" style={{ marginTop: "12px" }}>
                Don't have an account?{" "}
                <a href="/register" className="login-footer-link">
                  Register here
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Login;
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage("❌ Please enter your email address");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      
      // Send password reset email with redirect URL
      const actionCodeSettings = {
        url: `${window.location.origin}/action`,
        handleCodeInApp: true,
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      setMessage("✅ Password reset link sent!\n\nPlease check your email for the reset link.\nThe link will expire in 1 hour.");
      setMessageType("success");
      setSubmitted(true);
      setEmail("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Error sending reset email:", error);
      
      if (error?.code === "auth/user-not-found") {
        setMessage("❌ No account found with this email address.\n\nPlease check and try again or register a new account.");
      } else if (error?.code === "auth/invalid-email") {
        setMessage("❌ Invalid email address format.");
      } else if (error?.code === "auth/too-many-requests") {
        setMessage("❌ Too many reset requests.\n\nPlease try again later.");
      } else {
        setMessage("❌ " + (error?.message || "Failed to send reset email. Please try again."));
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .forgot-password-page {
          min-height: 100vh;
          display: flex;
          background: #fff;
        }

        .fp-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .fp-sidebar {
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

        .fp-sidebar-content h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 24px;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .fp-sidebar-content p {
          font-size: 16px;
          margin-bottom: 40px;
          opacity: 0.95;
          line-height: 1.7;
          max-width: 480px;
        }

        .fp-content-area {
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

        .fp-card {
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

        .fp-title {
          font-weight: 700;
          font-size: 28px;
          color: #222;
          margin-bottom: 12px;
          text-align: center;
        }

        .fp-subtitle {
          font-size: 14px;
          color: #6c757d;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.6;
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

        .message {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          border-left: 4px solid;
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

        .message.success {
          background: #d4edda;
          color: #155724;
          border-color: #28a745;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border-color: #dc3545;
        }

        .btn-submit {
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

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(13, 110, 253, 0.2);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fp-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .fp-footer-text {
          font-size: 13px;
          color: #6c757d;
        }

        .fp-footer-link {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 600;
          transition: color .2s;
          cursor: pointer;
        }

        .fp-footer-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        .success-icon {
          text-align: center;
          font-size: 48px;
          margin-bottom: 20px;
          animation: scaleIn .5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @media (max-width: 1024px) {
          .fp-sidebar {
            flex: 0.9;
            padding: 50px 40px;
          }

          .fp-sidebar-content h1 {
            font-size: 40px;
          }

          .fp-sidebar-content p {
            font-size: 15px;
          }

          .fp-card {
            padding: 40px;
            max-width: 380px;
          }

          .fp-content-area {
            padding: 30px;
          }
        }

        @media (max-width: 768px) {
          .fp-wrapper {
            flex-direction: column;
          }

          .fp-sidebar {
            padding: 40px 30px;
            text-align: center;
            justify-content: flex-start;
            padding-top: 40px;
            flex: auto;
          }

          .fp-sidebar-content h1 {
            font-size: 32px;
          }

          .fp-sidebar-content p {
            margin: 16px auto;
            max-width: 100%;
            font-size: 14px;
          }

          .fp-content-area {
            padding: 20px;
            flex: 1;
          }

          .fp-card {
            padding: 32px;
            max-width: 100%;
          }

          .fp-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .fp-sidebar {
            padding: 30px 20px;
          }

          .fp-sidebar-content h1 {
            font-size: 26px;
            margin-bottom: 16px;
          }

          .fp-sidebar-content p {
            font-size: 13px;
            margin-bottom: 24px;
          }

          .fp-content-area {
            padding: 16px;
          }

          .fp-card {
            padding: 24px;
            border-radius: 12px;
          }

          .logo {
            margin-bottom: 24px;
          }

          .fp-title {
            font-size: 22px;
            margin-bottom: 8px;
          }

          .fp-subtitle {
            font-size: 12px;
            margin-bottom: 20px;
          }

          .form-group {
            margin-bottom: 14px;
          }
        }
      `}</style>

      <div className="fp-wrapper">
        {/* SIDEBAR */}
        <div className="fp-sidebar">
          <div className="fp-sidebar-content">
            <h1>Forgot Your Password?</h1>
            <p>No worries! We'll help you reset it. Enter your email address and we'll send you a link to create a new password.</p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="fp-content-area">
          <main className="fp-card" role="main">
            <div className="logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.3V12.5Z" fill="white"/>
              </svg>
              <div className="brand">Montalban Jobs</div>
            </div>

            <h2 className="fp-title">Reset Password</h2>
            <p className="fp-subtitle">Enter your email address and we'll send you a link to reset your password</p>

            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
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

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div className="success-icon">✉️</div>
                <p style={{ color: "#6c757d", fontSize: "14px" }}>
                  Check your email for the password reset link.<br/>
                  You'll be redirected to login shortly...
                </p>
              </div>
            )}

            <div className="fp-footer">
              <p className="fp-footer-text">
                Remember your password?{" "}
                <a href="/login" className="fp-footer-link">
                  Back to Login
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
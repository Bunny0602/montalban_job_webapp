import { useState, useEffect } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const code = searchParams.get("oobCode");
    const mode = searchParams.get("mode");
    
    console.log("Reset Password - Mode:", mode);
    console.log("Reset Password - OOB Code:", code);
    
    // If no code, show error
    if (!code) {
      setMessage("❌ Invalid reset link. Please request a new one.");
      setMessageType("error");
      setVerifying(false);
      return;
    }

    // Verify the reset code with Firebase
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        console.log("✅ Reset code verified for email:", email);
        setOobCode(code);
        setValidCode(true);
        setVerifying(false);
      })
      .catch((error) => {
        console.error("❌ Invalid reset code:", error.code, error.message);
        
        if (error?.code === "auth/expired-action-code") {
          setMessage("❌ Reset link has expired.\n\nPlease request a new password reset link.");
        } else if (error?.code === "auth/invalid-action-code") {
          setMessage("❌ Invalid reset link.\n\nPlease request a new password reset link.");
        } else {
          setMessage("❌ Reset link has expired or is invalid.\n\nPlease request a new password reset link.");
        }
        
        setMessageType("error");
        setVerifying(false);
      });
  }, [searchParams]);

  const validatePasswordStrength = (pwd) => {
    const validation = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(v => v === true);
  };

  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(v => v === true).length;
    if (validCount <= 2) return { text: "Weak", color: "#dc3545" };
    if (validCount <= 4) return { text: "Medium", color: "#ffc107" };
    return { text: "Strong", color: "#28a745" };
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (value) validatePasswordStrength(value);
  };

  const validateForm = () => {
    if (!password || !confirmPassword) {
      setMessage("❌ Please fill in all fields");
      setMessageType("error");
      return false;
    }

    if (!Object.values(passwordValidation).every(v => v === true)) {
      setMessage("❌ Password must meet all requirements");
      setMessageType("error");
      return false;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Confirm the password reset with Firebase
      await confirmPasswordReset(auth, oobCode, password);

      console.log("✅ Password reset successfully");
      setMessage("✅ Password reset successful!\n\nYou will be redirected to login shortly.");
      setMessageType("success");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      console.error("❌ Error resetting password:", error.code, error.message);
      
      if (error?.code === "auth/weak-password") {
        setMessage("❌ Password is too weak. Please use a stronger password.");
      } else if (error?.code === "auth/expired-action-code") {
        setMessage("❌ Reset link has expired.\n\nPlease request a new password reset link.");
      } else if (error?.code === "auth/invalid-action-code") {
        setMessage("❌ Invalid reset link.\n\nPlease request a new password reset link.");
      } else {
        setMessage("❌ " + (error?.message || "Failed to reset password. Please try again."));
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="reset-password-page">
        <style>{`
          .reset-password-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading-spinner {
            text-align: center;
            color: #fff;
          }
          .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spinner-text {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
          }
          .spinner-subtext {
            color: rgba(255,255,255,0.9);
            font-size: 13px;
            margin-top: 8px;
          }
        `}</style>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="spinner-text">Verifying reset link...</p>
          <p className="spinner-subtext">Please wait while we validate your request</p>
        </div>
      </div>
    );
  }

  const isPasswordValid = Object.values(passwordValidation).every(v => v === true);
  const passwordStrength = getPasswordStrength();

  return (
    <div className="reset-password-page">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .reset-password-page {
          min-height: 100vh;
          display: flex;
          background: #fff;
        }

        .rp-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .rp-sidebar {
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

        .rp-sidebar-content h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 24px;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .rp-sidebar-content p {
          font-size: 16px;
          margin-bottom: 40px;
          opacity: 0.95;
          line-height: 1.7;
          max-width: 480px;
        }

        .rp-content-area {
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

        .rp-card {
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

        .rp-title {
          font-weight: 700;
          font-size: 28px;
          color: #222;
          margin-bottom: 12px;
          text-align: center;
        }

        .rp-subtitle {
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
          padding-right: 45px;
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

        .password-validation {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 13px;
        }

        .validation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .validation-item:last-child {
          margin-bottom: 0;
        }

        .validation-item.valid {
          color: #28a745;
        }

        .validation-item.invalid {
          color: #dc3545;
        }

        .validation-check {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .password-strength {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          text-align: center;
          font-weight: 600;
          font-size: 12px;
        }

        .match-indicator {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .match-indicator.valid {
          color: #28a745;
        }

        .match-indicator.invalid {
          color: #dc3545;
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

        .rp-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .rp-footer-text {
          font-size: 13px;
          color: #6c757d;
        }

        .rp-footer-link {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 600;
          transition: color .2s;
          cursor: pointer;
        }

        .rp-footer-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .rp-wrapper {
            flex-direction: column;
          }

          .rp-sidebar {
            padding: 40px 30px;
            text-align: center;
            flex: auto;
          }

          .rp-sidebar-content h1 {
            font-size: 32px;
          }

          .rp-content-area {
            padding: 20px;
            flex: 1;
          }

          .rp-card {
            padding: 32px;
            max-width: 100%;
          }

          .rp-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .rp-sidebar {
            padding: 30px 20px;
          }

          .rp-sidebar-content h1 {
            font-size: 26px;
          }

          .rp-content-area {
            padding: 16px;
          }

          .rp-card {
            padding: 24px;
          }

          .rp-title {
            font-size: 22px;
          }

          .form-input {
            padding-right: 40px;
          }

          .password-toggle {
            right: 10px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="rp-wrapper">
        {/* SIDEBAR */}
        <div className="rp-sidebar">
          <div className="rp-sidebar-content">
            <h1>Create New Password</h1>
            <p>Enter a new password for your account. Make sure it's strong and unique.</p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="rp-content-area">
          <main className="rp-card" role="main">
            <div className="logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.3V12.5Z" fill="white"/>
              </svg>
              <div className="brand">Montalban Jobs</div>
            </div>

            <h2 className="rp-title">Reset Your Password</h2>
            <p className="rp-subtitle">Enter a new password below</p>

            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            {validCode && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="form-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Enter new password"
                      value={password}
                      onChange={handlePasswordChange}
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

                  {/* Password Validation */}
                  {password && (
                    <div className="password-validation">
                      <div className={`validation-item ${passwordValidation.length ? "valid" : "invalid"}`}>
                        <span className="validation-check">{passwordValidation.length ? "✓" : "✕"}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`validation-item ${passwordValidation.uppercase ? "valid" : "invalid"}`}>
                        <span className="validation-check">{passwordValidation.uppercase ? "✓" : "✕"}</span>
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </div>
                      <div className={`validation-item ${passwordValidation.lowercase ? "valid" : "invalid"}`}>
                        <span className="validation-check">{passwordValidation.lowercase ? "✓" : "✕"}</span>
                        <span>At least 1 lowercase letter (a-z)</span>
                      </div>
                      <div className={`validation-item ${passwordValidation.number ? "valid" : "invalid"}`}>
                        <span className="validation-check">{passwordValidation.number ? "✓" : "✕"}</span>
                        <span>At least 1 numeric digit (0-9)</span>
                      </div>
                      <div className={`validation-item ${passwordValidation.special ? "valid" : "invalid"}`}>
                        <span className="validation-check">{passwordValidation.special ? "✓" : "✕"}</span>
                        <span>At least 1 special character (!@#$%^&*)</span>
                      </div>
                      <div className="password-strength" style={{ background: passwordStrength.color + "20", color: passwordStrength.color }}>
                        Strength: {passwordStrength.text}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="form-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? "🔓" : "🔒"}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className={`match-indicator ${password === confirmPassword ? "valid" : "invalid"}`}>
                      {password === confirmPassword ? "✓ Passwords match" : "✕ Passwords don't match"}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-submit" 
                  disabled={loading || !isPasswordValid || password !== confirmPassword}
                  title={!isPasswordValid ? "Password must meet all requirements" : password !== confirmPassword ? "Passwords must match" : ""}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            <div className="rp-footer">
              <p className="rp-footer-text">
                Remember your password?{" "}
                <a href="/login" className="rp-footer-link">
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

export default ResetPassword;
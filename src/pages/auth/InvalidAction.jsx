import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const InvalidAction = () => {
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        alert("Verification email sent! Please check your inbox.");
      } else {
        alert("No user found. Please log in first.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      alert("Failed to send verification email. Please try again.");
    }
  };

  const handlePasswordReset = async (email) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth-action`,
      handleCodeInApp: true,
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .invalid-action-card {
          background: #fff;
          border-radius: 16px;
          padding: 48px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: slideUp .5s ease-out;
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

        .invalid-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .invalid-title {
          font-size: 28px;
          font-weight: 700;
          color: #222;
          margin-bottom: 12px;
        }

        .invalid-message {
          font-size: 14px;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .invalid-reason {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #721c24;
          text-align: left;
        }

        .btn-group {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all .2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0d6efd, #0b5ed7);
          color: #fff;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(13, 110, 253, 0.3);
        }

        .btn-secondary {
          background: #e9ecef;
          color: #495057;
        }

        .btn-secondary:hover {
          background: #dee2e6;
        }

        @media (max-width: 480px) {
          .invalid-action-card {
            padding: 32px 24px;
          }

          .invalid-title {
            font-size: 24px;
          }

          .invalid-icon {
            font-size: 50px;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="invalid-action-card">
        <div className="invalid-icon">❌</div>
        <h1 className="invalid-title">Invalid Action Link</h1>
        <p className="invalid-message">
          The link you clicked is invalid, expired, or has already been used.
        </p>
        <div className="invalid-reason">
          💡 <strong>Possible reasons:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            <li>The link has expired</li>
            <li>The link was already used</li>
            <li>The link format is incorrect</li>
          </ul>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Go to Login
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/forgot-password")}>
            Reset Password
          </button>
          <button className="btn btn-secondary" onClick={() => handlePasswordReset(auth.currentUser?.email)}>
            Reset Password via Email
          </button>
          <button className="btn btn-secondary" onClick={handleResendVerification}>
            Resend Verification Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvalidAction;
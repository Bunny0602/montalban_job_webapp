import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      try {
        setLoading(true);
        setStatus("verifying");
        console.log("🔄 Starting email verification...");

        const mode = searchParams.get("mode");
        const oobCode = searchParams.get("oobCode");
        const continueUrl = searchParams.get("continueUrl");

        console.log("📋 URL Parameters:", { mode, oobCode, continueUrl });

        if (!mode || !oobCode) {
          if (isMounted) {
            console.warn("⚠️ Missing required parameters");
            setStatus("error");
            setMessage("Invalid verification link. Missing required parameters.");
            setLoading(false);
          }
          return;
        }

        if (mode !== "verifyEmail") {
          if (isMounted) {
            console.warn("⚠️ Invalid mode:", mode);
            setStatus("error");
            setMessage("Invalid verification mode.");
            setLoading(false);
          }
          return;
        }

        console.log("⏱️ Waiting 500ms for Firebase to process...");
        await new Promise((resolve) => setTimeout(resolve, 500));

        let actionCodeInfo;
        try {
          console.log("🔍 Checking action code...");
          actionCodeInfo = await checkActionCode(auth, oobCode);
          const email = actionCodeInfo?.data?.email;

          console.log("✓ Action code valid. Email:", email);
          if (email && isMounted) {
            setUserEmail(email);
          }
        } catch (checkError) {
          if (isMounted) {
            console.error("❌ Error checking action code:", checkError);
            setStatus("error");
            setMessage("The verification link is invalid or has expired.");
            setLoading(false);
          }
          return;
        }

        try {
          console.log("🔐 Applying action code...");
          await applyActionCode(auth, oobCode);
          console.log("✅ Action code applied successfully!");

          if (!isMounted) return;

          if (auth.currentUser) {
            try {
              console.log("📝 Updating Firestore with emailVerified: true");
              const userRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                emailVerified: true,
                updatedAt: new Date(),
              });
              console.log("✓ Firestore updated successfully!");
            } catch (firestoreError) {
              console.warn("⚠️ Could not update Firestore (optional):", firestoreError);
            }
          }

          if (isMounted) {
            console.log("🎉 EMAIL VERIFICATION SUCCESSFUL!");
            setStatus("success");
            setMessage("✅ Your email has been successfully verified!");

            if (continueUrl) {
              sessionStorage.setItem("verificationContinueUrl", continueUrl);
            }

            setLoading(false);
          }
        } catch (applyError) {
          if (isMounted) {
            console.error("❌ Failed to apply action code:", applyError.code, applyError.message);
            throw applyError;
          }
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("💥 EMAIL VERIFICATION ERROR:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        let errorMessage = "Failed to verify your email.";

        if (error.code === "auth/invalid-action-code") {
          console.warn("🔴 Invalid or expired action code");
          errorMessage = "The verification link is invalid or has expired. Please request a new one.";
        } else if (error.code === "auth/expired-action-code") {
          console.warn("🔴 Action code expired");
          errorMessage = "The verification link has expired. Please request a new one.";
        } else if (error.code === "auth/user-not-found") {
          console.warn("🔴 User not found");
          errorMessage = "User account not found.";
        } else if (error.code === "auth/weak-email") {
          console.warn("🔴 Weak email format");
          errorMessage = "The email format is invalid.";
        }

        setStatus("error");
        setMessage(errorMessage);
        setLoading(false);
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .verify-email-card {
          background: #fff;
          border-radius: 16px;
          padding: 48px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.5s ease-out;
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .verify-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .verify-spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        .verify-title {
          font-size: 28px;
          font-weight: 700;
          color: #222;
          margin-bottom: 12px;
        }

        .verify-message {
          font-size: 14px;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .verify-email-display {
          background: #f0f0f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #495057;
          word-break: break-all;
        }

        .verify-alert {
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          text-align: left;
        }

        .verify-alert-success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .verify-alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
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

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #e9ecef;
          color: #495057;
        }

        .btn-secondary:hover {
          background: #dee2e6;
        }

        .btn-group {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        @media (max-width: 480px) {
          .verify-email-card {
            padding: 32px 24px;
          }

          .verify-title {
            font-size: 24px;
          }

          .verify-icon {
            font-size: 50px;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="verify-email-card">
        <div className="verify-icon">
          {loading ? (
            <span className="verify-spinner">⏳</span>
          ) : status === "success" ? (
            "✅"
          ) : (
            "❌"
          )}
        </div>

        <h1 className="verify-title">
          {loading
            ? "Verifying Email"
            : status === "success"
            ? "Email Verified!"
            : "Verification Failed"}
        </h1>

        <p className="verify-message">{message}</p>

        {userEmail && (
          <div className="verify-email-display">
            <strong>Email:</strong> {userEmail}
          </div>
        )}

        <div
          className={`verify-alert ${
            status === "success" ? "verify-alert-success" : "verify-alert-error"
          }`}
          style={{ display: status === "verifying" ? "none" : "block" }}
        >
          {status === "success"
            ? "You can now log in with your verified email address."
            : "Please contact support or request a new verification link."}
        </div>

        <div className="btn-group">
          {status === "success" ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => {
                  sessionStorage.removeItem("verificationContinueUrl");
                  navigate("/login");
                }}
              >
                Go to Login
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/register")}
              >
                Back to Register
              </button>
            </>
          ) : status === "error" ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          ) : (
            <button className="btn btn-primary" disabled>
              {loading ? "Verifying..." : "Processing..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const EmailActionHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const apiKey = searchParams.get("apiKey");
    const continueUrl = searchParams.get("continueUrl");

    console.log("📧 Email Action Handler - Mode:", mode);

    // Build query string to pass to target route
    const queryString = new URLSearchParams();
    if (mode) queryString.append("mode", mode);
    if (oobCode) queryString.append("oobCode", oobCode);
    if (apiKey) queryString.append("apiKey", apiKey);
    if (continueUrl) queryString.append("continueUrl", continueUrl);

    const params = `?${queryString.toString()}`;

    if (mode === "resetPassword") {
      console.log("🔄 Redirecting to password reset...");
      navigate(`/action${params}`, { replace: true });
    } else if (mode === "verifyEmail") {
      console.log("✉️ Redirecting to email verification...");
      navigate(`/verify-email${params}`, { replace: true });
    } else if (mode === "signIn") {
      console.log("🔐 Sign-in link (not implemented)");
      navigate("/login", { replace: true });
    } else {
      console.warn("⚠️ Invalid or missing mode:", mode);
      navigate("/invalid-action", { replace: true });
    }
  }, [searchParams, navigate]);

  // Show loading state while redirecting
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      flexDirection: "column",
      gap: "20px",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: "60px",
        height: "60px",
        border: "4px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}></div>
      <p style={{ fontSize: "16px", fontWeight: "600" }}>Processing your request...</p>
      <p style={{ fontSize: "13px", opacity: "0.9" }}>Please wait while we redirect you</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailActionHandler;
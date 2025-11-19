import React from "react";

const PrivacyModal = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        padding: "20px",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px",
            borderBottom: "1px solid #e9ecef",
            position: "sticky",
            top: 0,
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            zIndex: 10,
          }}
        >
          <h2
            id="privacy-modal-title"
            style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#222" }}
          >
            Privacy Policy
          </h2>
          <button
            onClick={onClose}
            aria-label="Close Privacy Policy modal"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6c757d",
              padding: "4px 8px",
              transition: "color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#222")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6c757d")}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            overflowY: "auto",
            padding: "24px",
            flex: 1,
          }}
        >
          <div style={{ fontSize: "14px", color: "#444", lineHeight: "1.8" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              1. Information We Collect
            </h3>
            <p>
              We collect the following information during registration:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>Full name (or company name)</li>
              <li>Email address</li>
              <li>Contact number</li>
              <li>Resume/CV (for job seekers)</li>
              <li>Business documents (for employers)</li>
              <li>Location information (Barangay, Address)</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              2. How We Use Your Data
            </h3>
            <p>
              Your information is used only to provide the following services:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>Job posting and management</li>
              <li>Job application processing</li>
              <li>User account management</li>
              <li>Communication regarding your account</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              3. Data Sharing
            </h3>
            <p>
              Your personal information is not shared with third parties without your explicit consent, except where required by law or for system operations.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              4. Data Security
            </h3>
            <p>
              We store all data securely on Firebase with industry-standard encryption. Access is strictly limited to authorized admins for system maintenance and moderation purposes only.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              5. Your Rights
            </h3>
            <p>
              You have the right to:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>Request your data at any time</li>
              <li>Request account deletion</li>
              <li>Request data removal (GDPR & local privacy laws compliance)</li>
            </ul>
            <p>
              To exercise these rights, please contact our support team.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              6. Cookies & Local Storage
            </h3>
            <p>
              We use cookies and local storage only for:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>Login session management</li>
              <li>Form functionality and data persistence</li>
            </ul>
            <p>
              We do not use tracking cookies or third-party analytics that collect personal data.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              7. Admin Responsibilities
            </h3>
            <p>
              Admins are responsible for protecting user data and only access data for:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>Content moderation</li>
              <li>System maintenance</li>
              <li>User support and troubleshooting</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              8. Policy Updates
            </h3>
            <p>
              We may update this Privacy Policy from time to time. Changes will be notified to users via email or announcements on the platform.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              9. Contact Us
            </h3>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact our support team through the platform.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e9ecef",
            background: "#f8f9fa",
            borderRadius: "0 0 16px 16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              background: "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(13, 110, 253, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Close
          </button>
        </div>

        <style>{`
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
        `}</style>
      </div>
    </div>
  );
};

export default PrivacyModal;
import React from "react";

const TermsModal = ({ isOpen, onClose }) => {
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
      aria-labelledby="terms-modal-title"
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
            id="terms-modal-title"
            style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#222" }}
          >
            Terms & Conditions
          </h2>
          <button
            onClick={onClose}
            aria-label="Close Terms & Conditions modal"
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
              1. Eligibility
            </h3>
            <p>
              Users must be either local job seekers or employers in Montalban, Rizal. By registering, you confirm that you meet these requirements and agree to comply with all terms outlined below.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              2. User Responsibilities
            </h3>
            <p>
              <strong>Employers:</strong> Must provide accurate company and job information. All job postings must comply with local labor laws and industry standards.
            </p>
            <p>
              <strong>Job Seekers:</strong> Must provide truthful personal and employment details. All information must be accurate and up-to-date.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              3. Prohibited Content
            </h3>
            <p>
              Users agree not to post fraudulent, offensive, or illegal content. This includes:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
              <li>False or misleading job postings</li>
              <li>Discriminatory or hateful content</li>
              <li>Spam or phishing attempts</li>
              <li>Harassment or threats</li>
              <li>Illegal or unethical opportunities</li>
            </ul>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              4. Content Moderation
            </h3>
            <p>
              The admin reserves the right to remove any content that violates these terms. Violations may result in account suspension or termination.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              5. Account Suspension & Termination
            </h3>
            <p>
              Accounts can be suspended or terminated for violations of these terms. Users will be notified of any violations. Repeated violations may result in permanent account closure.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              6. Legal Compliance
            </h3>
            <p>
              Users must follow all local labor laws when posting or applying for jobs. Montalban Job System is not responsible for ensuring compliance, but reserves the right to remove non-compliant content.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              7. Limitation of Liability
            </h3>
            <p>
              Montalban Job System is not responsible for agreements made between employers and job seekers. Users engage with each other at their own risk and discretion.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              8. Admin Access
            </h3>
            <p>
              Admin access is strictly for system maintenance and moderation purposes. Admins will not access user data for any other purpose.
            </p>

            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#222", marginTop: "16px", marginBottom: "8px" }}>
              9. Agreement
            </h3>
            <p>
              By checking the agreement box and registering, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
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

export default TermsModal;
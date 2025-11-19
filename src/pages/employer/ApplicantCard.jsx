import React, { useState, memo } from "react";

const ApplicantCard = ({ 
  applicant = {}, 
  onAccept, 
  onReject, 
  onSchedule,
  onViewProfile,
  onViewResume 
}) => {
  const [loading, setLoading] = useState({
    accept: false,
    reject: false,
    schedule: false,
    profile: false,
    resume: false,
  });

  const runHandler = async (key, handler) => {
    if (typeof handler !== "function") {
      console.warn(`No handler provided for ${key}`);
      return;
    }
    setLoading((s) => ({ ...s, [key]: true }));
    try {
      await Promise.resolve(handler(applicant));
    } catch (err) {
      console.error(`${key} handler error:`, err);
    } finally {
      setLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const displayName =
    applicant.fullName || applicant.name || applicant.userName || applicant.displayName || "";

  const initials = (() => {
    const name = displayName.trim();
    if (!name) return "AP";
    return name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() || "")
      .slice(0, 2)
      .join("");
  })();

  const contact =
    applicant.contactNumber || applicant.phone || applicant.contact || applicant.mobile || "";

  const email =
    applicant.emailAddress || applicant.email || applicant.userEmail || "";  

  // Fix resume URL - handle base64 and regular URLs
  const resumeUrl = (() => {
    const resume = applicant.resumeLink || applicant.resume || applicant.resumeURL || applicant.cv || "";
    if (!resume) return "";
    
    // If it's base64, return as-is
    if (resume.startsWith("data:")) return resume;
    
    // If it's a URL, normalize it
    if (/^https?:\/\//i.test(resume)) return resume;
    
    // Otherwise add https://
    return `https://${resume}`;
  })();

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      if (ts.toDate) return new Date(ts.toDate()).toLocaleDateString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
      return new Date(ts).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "#fff3cd", color: "#856404", icon: "" };
      case "accepted":
        return { bg: "#d4edda", color: "#155724", icon: "" };
      case "scheduled":
        return { bg: "#cfe2ff", color: "#084298", icon: "" };
      case "rejected":
        return { bg: "#f8d7da", color: "#721c24", icon: "" };
      default:
        return { bg: "#e2e3e5", color: "#383d41", icon: "•" };
    }
  };

  const statusStyle = getStatusColor(applicant.status);
  const isPending = applicant.status === "pending";
  const isAccepted = applicant.status === "accepted";
  const isRejected = applicant.status === "rejected";
  const isScheduled = applicant.status === "scheduled";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 18,
        border: "1px solid #e9ecef",
        borderRadius: 14,
        marginBottom: 14,
        backgroundColor: "#fff",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
        transition: "all 0.2s ease",
        width: "100%",
      }}
      role="group"
      aria-label={`Applicant ${displayName || "candidate"}`}
    >
      {/* Header Row */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0 }}>
          {/* Avatar */}
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 12,
              background: applicant.profileImage ? "transparent" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 20,
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.12)",
              border: "2px solid #f0f8ff",
            }}
          >
            {applicant.profileImage ? (
              <img
                src={applicant.profileImage}
                alt={displayName || "applicant"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Info */}
          <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
            <h4
              style={{
                margin: "0 0 4px 0",
                fontSize: 16,
                fontWeight: 800,
                color: "#0f1724",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={displayName}
            >
              {displayName || "Unnamed Applicant"}
            </h4>

            {applicant.positionApplied && (
              <div style={{ fontSize: 13, color: "#0d6efd", fontWeight: 700, marginBottom: 6 }}>
                {applicant.positionApplied}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#6c757d" }}>
              {applicant.email && (
                <a
                  href={`mailto:${applicant.email}`}
                  style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 600 }}
                  title={applicant.email}
                >
                  {email}
                </a>
              )}
              {contact && (
                <a
                  href={`tel:${contact}`}
                  style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 600 }}
                  title={contact}
                >
                  {contact}
                </a>
              )}
              {applicant.appliedAt && (
                <span>{formatDate(applicant.appliedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
            flexShrink: 0,
          }}
        >
          <span>{statusStyle.icon}</span>
          {(applicant.status || "pending").toUpperCase()}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#f0f4f9" }} />

      {/* Quick Info Row */}
      {(applicant.raw?.desiredJob || applicant.experience || applicant.raw?.skills) && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
            {applicant.raw?.desiredJob && (
              <div style={{ background: "#f0f8ff", padding: "6px 12px", borderRadius: 8, color: "#0d6efd", fontWeight: 600 }}>
                {applicant.raw.desiredJob}
              </div>
            )}
            {applicant.experience && (
              <div style={{ background: "#f0fdf4", padding: "6px 12px", borderRadius: 8, color: "#15803d", fontWeight: 600 }}>
                {applicant.experience} yrs
              </div>
            )}
            {applicant.raw?.skills && (
              <div style={{ background: "#fef3c7", padding: "6px 12px", borderRadius: 8, color: "#92400e", fontWeight: 600 }}>
                {applicant.raw.skills.split(",").slice(0, 2).join(", ")}
              </div>
            )}
          </div>
          <div style={{ height: "1px", background: "#f0f4f9" }} />
        </>
      )}

      {/* Action Buttons Row - CONDITIONAL RENDERING */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* View Buttons - Always show */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* View Profile Button */}
          <button
            onClick={() => runHandler("profile", onViewProfile)}
            disabled={loading.profile}
            title="View applicant full profile"
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #d4e3ff",
              background: "#f8fbff",
              color: "#0d6efd",
              cursor: loading.profile ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              transition: "all 0.12s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: loading.profile ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading.profile) {
                e.target.style.background = "#e9f4ff";
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f8fbff";
              e.target.style.transform = "none";
            }}
          >
            {loading.profile ? "..." : "Profile"}
          </button>

          {/* View Resume Button - Only show if resumeUrl exists */}
          {resumeUrl && (
            <button
              onClick={() => runHandler("resume", onViewResume)}
              disabled={loading.resume}
              title="View and download resume"
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px solid #d4e3ff",
                background: "#f8fbff",
                color: "#0d6efd",
                cursor: loading.resume ? "wait" : "pointer",
                fontWeight: 700,
                fontSize: 13,
                transition: "all 0.12s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: loading.resume ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading.resume) {
                  e.target.style.background = "#e9f4ff";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f8fbff";
                e.target.style.transform = "none";
              }}
            >
              {loading.resume ? "..." : " Resume"}
            </button>
          )}
        </div>

        {/* Action Buttons - CONDITIONAL */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          
          {/* PENDING: Show Schedule, Accept, Reject */}
          {isPending && (
            <>
              <button
                onClick={() => runHandler("schedule", onSchedule)}
                disabled={loading.schedule}
                title="Schedule interview"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#0d6efd",
                  color: "#fff",
                  cursor: loading.schedule ? "wait" : "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  transition: "all 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading.schedule ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading.schedule) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(13, 110, 253, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                {loading.schedule ? "..." : "Schedule"}
              </button>

              <button
                onClick={() => runHandler("accept", onAccept)}
                disabled={loading.accept}
                title="Accept applicant"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#28a745",
                  color: "#fff",
                  cursor: loading.accept ? "wait" : "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  transition: "all 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading.accept ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading.accept) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(40, 167, 69, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                {loading.accept ? "..." : "Accept"}
              </button>

              <button
                onClick={() => runHandler("reject", onReject)}
                disabled={loading.reject}
                title="Reject applicant"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#dc3545",
                  color: "#fff",
                  cursor: loading.reject ? "wait" : "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                  transition: "all 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading.reject ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading.reject) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(220, 53, 69, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                {loading.reject ? "..." : "Reject"}
              </button>
            </>
          )}

          {/* ACCEPTED: Only show status - no action buttons */}
          {isAccepted && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#d4edda",
              color: "#155724",
              fontWeight: 800,
              fontSize: 13,
              border: "1px solid #c3e6cb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              Accepted
            </div>
          )}

          {/* REJECTED: Only show status - no action buttons */}
          {isRejected && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#f8d7da",
              color: "#721c24",
              fontWeight: 800,
              fontSize: 13,
              border: "1px solid #f5c6cb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              Rejected
            </div>
          )}

          {/* SCHEDULED: Only show status - no action buttons */}
          {isScheduled && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#d1ecf1",
              color: "#0c5460",
              fontWeight: 800,
              fontSize: 13,
              border: "1px solid #bee5eb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              Scheduled
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default memo(ApplicantCard);
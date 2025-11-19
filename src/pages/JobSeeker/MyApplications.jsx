import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";

const MyApplications = () => {
  const user = auth.currentUser;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [error, setError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelMessage, setCancelMessage] = useState("");

  // Fetch job seeker's applications (live)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "applications"), where("seekerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const apps = snap.docs
          .map((d) => ({
            id: d.id,
            jobTitle: d.data().positionApplied || d.data().jobTitle || d.data().job || "Unknown Job",
            companyName: d.data().companyName || "Unknown Company",
            status: d.data().status || "pending",
            appliedAt: d.data().appliedAt || null,
            scheduledAt: d.data().scheduledAt || null,
            rejectionReason: d.data().rejectionReason || "",
            interviewDetails: d.data().interviewDetails || "",
            ...d.data(),
          }))
          .sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setApplications(apps);
        setLoading(false);
      },
      (err) => {
        console.error("MyApplications error:", err);
        setError("Failed to load applications");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      if (ts.toDate) return new Date(ts.toDate()).toLocaleString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "#fff3cd", color: "#856404", label: "Pending" },
      accepted: { bg: "#d4edda", color: "#155724", label: "Accepted" },
      rejected: { bg: "#f8d7da", color: "#721c24", label: "Rejected" },
      scheduled: { bg: "#d1ecf1", color: "#0c5460", label: "Scheduled" },
    };
    return badges[status] || badges.pending;
  };

  const openDetails = (app) => {
    setSelectedApp(app);
    setCancelMessage("");
  };

  const closeDetails = () => {
    setSelectedApp(null);
    setCancelMessage("");
  };

  // Cancel Application - Delete from database
  const handleCancelApplication = async () => {
    if (!selectedApp) return;

    // Only allow canceling pending applications
    if (selectedApp.status !== "pending") {
      setCancelMessage("❌ You can only cancel pending applications.");
      return;
    }

    try {
      setCancelingId(selectedApp.id);
      setCancelMessage("Canceling application...");

      // Delete application document
      await deleteDoc(doc(db, "applications", selectedApp.id));

      setCancelMessage("✅ Application canceled successfully! You can apply again later.");
      
      // Close modal after 2 seconds
      setTimeout(() => {
        closeDetails();
        setCancelMessage("");
      }, 2000);
    } catch (err) {
      console.error("Error canceling application:", err);
      setCancelMessage("❌ Error canceling application: " + (err.message || "Unknown error"));
      setCancelingId(null);
    }
  };

  const LoadingSkeleton = () => (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#f8fafc",
            marginBottom: 12,
            border: "1px solid #eef4fb",
            animation: "pulse 2s infinite",
          }}
        >
          <div style={{ height: 16, background: "#e0e7ff", borderRadius: 8, marginBottom: 12, width: "60%" }} />
          <div style={{ height: 12, background: "#e0e7ff", borderRadius: 6, width: "40%" }} />
        </div>
      ))}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        .my-apps-container { padding: 0; }
        .my-apps-header { margin-bottom: 24px; }
        .my-apps-title { font-size: 24px; font-weight: 800; color: #12263b; margin: 0 0 8px 0; }
        .my-apps-subtitle { font-size: 14px; color: #6c757d; margin: 0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(6,12,24,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
        .modal { width: 100%; max-width: 600px; background: #fff; border-radius: 12px; box-shadow: 0 24px 80px rgba(2,6,23,0.4); overflow: hidden; max-height: 90vh; display: flex; flex-direction: column; }
        .modal-header { padding: 18px; border-bottom: 1px solid #f0f4f9; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 18px; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 12px 18px; border-top: 1px solid #f0f4f9; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
        
        .info-box { margin-bottom: 14px; }
        .info-label { font-size: 12px; color: #6c757d; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
        .info-value { color: #12263b; font-size: 15px; font-weight: 600; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .info-grid.full { grid-template-columns: 1fr; }

        .message-alert {
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          border-left: 4px solid;
          animation: slideDown 0.2s ease-out;
        }

        .message-alert.success {
          border-color: #28a745;
          background: #d4edda;
          color: #155724;
        }

        .message-alert.error {
          border-color: #dc3545;
          background: #f8d7da;
          color: #721c24;
        }

        .message-alert.info {
          border-color: #0d6efd;
          background: #e7f1ff;
          color: #0d6efd;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #0d6efd;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0b5ed7;
          transform: translateY(-2px);
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-2px);
        }

        .btn-cancel {
          background: #f8f9fa;
          border: 1px solid #eef4fb;
          color: #6c757d;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #e0e7ff;
        }
      `}</style>

      <div className="my-apps-container">
        <div className="my-apps-header">
          <h2 className="my-apps-title">My Applications</h2>
          <p className="my-apps-subtitle">Your job applications and status updates</p>
        </div>

        {error && (
          <div style={{ margin: "0 0 12px 0", color: "#c82333", fontWeight: 700 }}>
            {error}
          </div>
        )}
        
        {/* Applications List */}
        <div>
          {loading ? (
            <LoadingSkeleton />
          ) : applications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6c757d" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div>No applications yet. Start applying to jobs!</div>
            </div>
          ) : (
            applications.map((app) => {
              const badge = getStatusBadge(app.status);
              return (
                <div
                  key={app.id}
                  onClick={() => openDetails(app)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: 18,
                    border: "1px solid #eef4fb",
                    borderRadius: 12,
                    marginBottom: 12,
                    backgroundColor: "#fff",
                    boxShadow: "0 8px 24px rgba(2,6,23,0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 40px rgba(2,6,23,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(2,6,23,0.04)")}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: "#12263b" }}>
                      {app.jobTitle}
                    </h4>
                    <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 8 }}>
                      {app.companyName}
                    </div>
                    <div style={{ fontSize: 12, color: "#adb5bd", marginBottom: 8 }}>
                      Applied: {formatDate(app.appliedAt)}
                    </div>

                    {app.status === "scheduled" && app.scheduledAt && (
                      <div style={{ fontSize: 12, color: "#17a2b8", fontWeight: 700 }}>
                        Interview: {formatDate(app.scheduledAt)}
                      </div>
                    )}

                    {app.status === "rejected" && app.rejectionReason && (
                      <div style={{ fontSize: 12, color: "#dc3545", marginTop: 6 }}>
                        <strong>Reason:</strong> {app.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeDetails}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedApp.jobTitle}</h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>{selectedApp.companyName}</div>
              </div>
              <button
                onClick={closeDetails}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#adb5bd", padding: 0 }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Cancel Message */}
              {cancelMessage && (
                <div
                  className={`message-alert ${
                    cancelMessage.includes("Error") || cancelMessage.includes("❌") ? "error" : 
                    cancelMessage.includes("success") || cancelMessage.includes("✅") ? "success" : "info"
                  }`}
                >
                  {cancelMessage}
                </div>
              )}

              {/* JOB & COMPANY INFO */}
              <div className="info-grid">
                <div className="info-box">
                  <label className="info-label">Company</label>
                  <div className="info-value">{selectedApp.companyName}</div>
                </div>

                {selectedApp.jobTitle && (
                  <div className="info-box">
                    <label className="info-label">Job Title</label>
                    <div className="info-value">{selectedApp.jobTitle}</div>
                  </div>
                )}
              </div>

              {/* LOCATION - COMBINED */}
              <div className="info-box">
                <label className="info-label">Location</label>
                <div className="info-value">
                  {selectedApp.companyBarangay && selectedApp.companyAddress ? (
                    <>{selectedApp.companyBarangay}, {selectedApp.companyAddress}</>
                  ) : selectedApp.companyBarangay ? (
                    selectedApp.companyBarangay
                  ) : selectedApp.companyAddress ? (
                    selectedApp.companyAddress
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {/* CONTACT NUMBER */}
              {selectedApp.jobContactNumber && (
                <div className="info-box">
                  <label className="info-label">Contact Number</label>
                  <div className="info-value">
                    <a href={`tel:${selectedApp.jobContactNumber}`} style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 600 }}>
                      {selectedApp.jobContactNumber}
                    </a>
                  </div>
                </div>
              )}

              {/* UPLOAD DOCUMENTS */}
              {(selectedApp.profileImage || selectedApp.resumeLink) && (
                <div style={{ marginBottom: 14, padding: 12, background: "#f8fbff", borderRadius: 8, border: "1px solid #d4e3ff" }}>
                  <label className="info-label" style={{ color: "#0d6efd" }}>Uploaded Documents</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {selectedApp.resumeLink && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span></span>
                        <span style={{ color: "#12263b", fontWeight: 600 }}>
                          {selectedApp.resumeName || "Resume"}
                        </span>
                        <span style={{ color: "#28a745", fontWeight: 600, marginLeft: "auto" }}>✓ Attached</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* APPLICATION STATUS */}
              <div className="info-box">
                <label className="info-label">Status</label>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      backgroundColor: getStatusBadge(selectedApp.status).bg,
                      color: getStatusBadge(selectedApp.status).color,
                    }}
                  >
                    {getStatusBadge(selectedApp.status).label}
                  </span>
                </div>
              </div>

              {/* APPLIED DATE */}
              <div className="info-box">
                <label className="info-label">Applied Date</label>
                <div className="info-value">{formatDate(selectedApp.appliedAt)}</div>
              </div>

              {/* SCHEDULED INTERVIEW */}
              {selectedApp.status === "scheduled" && selectedApp.scheduledAt && (
                <div style={{ marginBottom: 14, padding: 12, background: "#d1ecf1", borderRadius: 8, border: "1px solid #bee5eb" }}>
                  <strong style={{ color: "#0c5460", fontSize: 13 }}>Interview Scheduled</strong>
                  <div style={{ marginTop: 6, color: "#0c5460", fontWeight: 700, fontSize: 14 }}>
                    {formatDate(selectedApp.scheduledAt)}
                  </div>
                  {selectedApp.interviewDetails && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#0c5460", borderTop: "1px solid #bee5eb", paddingTop: 8 }}>
                      <strong>Details:</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedApp.interviewDetails}</div>
                    </div>
                  )}
                </div>
              )}

              {/* REJECTED */}
              {selectedApp.status === "rejected" && (
                <div style={{ marginBottom: 14, padding: 12, background: "#f8d7da", borderRadius: 8, border: "1px solid #f5c6cb" }}>
                  <strong style={{ color: "#721c24", fontSize: 13 }}>✗ Application Rejected</strong>
                  {selectedApp.rejectionReason ? (
                    <div style={{ marginTop: 8, color: "#721c24", fontSize: 13 }}>
                      <strong>Reason:</strong>
                      <div style={{ marginTop: 4 }}>{selectedApp.rejectionReason}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, color: "#721c24", fontStyle: "italic", fontSize: 13 }}>
                      The application was not successful at this time. You are encouraged to explore and apply for other suitable opportunities in the future.
                    </div>
                  )}
                  {selectedApp.rejectionComment && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f5c6cb", fontSize: 12, color: "#721c24" }}>
                      <strong>Feedback:</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedApp.rejectionComment}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ACCEPTED */}
              {selectedApp.status === "accepted" && (
                <div style={{ marginBottom: 14, padding: 12, background: "#d4edda", borderRadius: 8, border: "1px solid #c3e6cb" }}>
                  <strong style={{ color: "#155724", fontSize: 13 }}>✓ Application Accepted!</strong>
                  <div style={{ marginTop: 8, color: "#155724", fontSize: 13 }}>
                    Congratulations! You have been accepted to start working. Please check for next steps or wait for the employer to contact you regarding your schedule.
                  </div>
                  {selectedApp.acceptanceRequirements && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #c3e6cb", fontSize: 12, color: "#155724" }}>
                      <strong>📋 Required Documents:</strong>
                      <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedApp.acceptanceRequirements}</div>
                    </div>
                  )}
                </div>
              )}

              {/* PENDING */}
              {selectedApp.status === "pending" && (
                <div style={{ marginBottom: 14, padding: 12, background: "#fff3cd", borderRadius: 8, border: "1px solid #ffeaa7" }}>
                  <strong style={{ color: "#856404", fontSize: 13 }}>Application Pending</strong>
                  <div style={{ marginTop: 8, color: "#856404", fontSize: 13 }}>
                    Your application is under review. The employer will respond soon.
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={closeDetails}
                disabled={cancelingId === selectedApp.id}
              >
                Close
              </button>

              {/* Cancel Application Button - Only for Pending */}
              {selectedApp.status === "pending" && (
                <button
                  className="btn btn-danger"
                  onClick={handleCancelApplication}
                  disabled={cancelingId === selectedApp.id}
                >
                  {cancelingId === selectedApp.id ? "Canceling..." : "❌ Cancel Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
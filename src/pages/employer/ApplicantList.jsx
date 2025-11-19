// ...existing code...
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import ApplicantCard from "./ApplicantCard";

const SkeletonList = ({ count = 5 }) => {
  return (
    <div>
      <style>{`
        .al-skeleton { animation: shimmer 1.6s linear infinite; background: linear-gradient(90deg,#f6f8fb 25%,#eef4f9 50%,#f6f8fb 75%); background-size: 200% 100%; }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #eef4fb", marginBottom: 12, alignItems: "center", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }} aria-hidden>
          <div className="al-skeleton" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="al-skeleton" style={{ height: 14, width: "60%", borderRadius: 6, marginBottom: 8 }} />
            <div className="al-skeleton" style={{ height: 12, width: "40%", borderRadius: 6 }} />
          </div>
          <div style={{ width: 160, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <div className="al-skeleton" style={{ height: 34, width: 34, borderRadius: 8 }} />
            <div className="al-skeleton" style={{ height: 34, width: 34, borderRadius: 8 }} />
            <div className="al-skeleton" style={{ height: 34, width: 34, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ApplicationList = () => {
  const user = auth.currentUser;
  const [jobs, setJobs] = useState({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(null);

  // fetch employer jobs (live)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "jobs"), where("employerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }));
        setJobs(map);
      },
      (err) => {
        console.error("jobs onSnapshot err:", err);
      }
    );
    return () => unsub();
  }, [user]);

  // listen to all applications and filter by employer's jobs
  useEffect(() => {
    if (!user) return;
    const appsCol = collection(db, "applications");
    const unsub = onSnapshot(
      appsCol,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // filter by jobId present in employer jobs
        const jobIds = Object.keys(jobs);
        const filtered = all
          .filter((a) => jobIds.includes(a.jobId))
          .map((app) => ({
            id: app.id,
            seekerId: app.seekerId || app.userId || "",
            fullName: app.fullName || app.name || app.userName || "",
            email: app.email || "",
            contactNumber: app.contactNumber || app.phone || app.contact || "",
            resumeLink: app.resumeLink || app.resume || app.resumeURL || "",
            jobId: app.jobId || "",
            positionApplied: jobs[app.jobId]?.jobTitle || app.positionApplied || "",
            status: app.status || "pending",
            appliedAt: app.appliedAt || app.createdAt || null,
            scheduledAt: app.scheduledAt || null,
            profileImage: app.profileImage || "",
            coverLetter: app.coverLetter || app.message || "",
            resumeName: app.resumeName || "",
            raw: app,
          }))
          .sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
        setApplications(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("applications onSnapshot err:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [jobs, user]);

  // FIX 1: Add the filteredApplications calculation
  const filteredApplications = applications.filter((a) => {
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    const q = (searchQuery || "").toLowerCase().trim();
    const searchMatch =
      !q ||
      (a.fullName || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      (a.positionApplied || "").toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  // FIX 2: Add missing openView function
  const openView = (applicant) => {
    setSelectedApplicant(applicant);
    // prefill schedule inputs if scheduledAt exists
    if (applicant.scheduledAt) {
      try {
        const dt = applicant.scheduledAt.toDate ? applicant.scheduledAt.toDate() : new Date(applicant.scheduledAt);
        setScheduleDate(dt.toISOString().slice(0, 10));
        setScheduleTime(dt.toTimeString().slice(0, 5));
      } catch {
        setScheduleDate("");
        setScheduleTime("");
      }
    } else {
      setScheduleDate("");
      setScheduleTime("");
    }
  };

  // FIX 3: Add missing updateStatus function (ERROR #5, #6, #7)
  const updateStatus = async (applicant, newStatus, scheduledAt = null) => {
    try {
      setActionLoading(true);
      const ref = doc(db, "applications", applicant.id);
      const updateData = {
        status: newStatus,
        updatedAt: Timestamp.now()
      };

      if (scheduledAt) {
        updateData.scheduledAt = scheduledAt;
      }

      await updateDoc(ref, updateData);

      // Update local state immediately to reflect changes
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicant.id
            ? { ...app, status: newStatus, scheduledAt: scheduledAt || app.scheduledAt }
            : app
        )
      );

      setSelectedApplicant(null);
      setScheduleDate("");
      setScheduleTime("");

      alert(`${newStatus === "accepted" ? "✅ Accepted" : newStatus === "rejected" ? "❌ Rejected" : "📅 Scheduled"} ${applicant.fullName || "applicant"}`);
    } catch (err) {
      console.error("updateStatus err:", err);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (applicant) => {
    if (!window.confirm(`Accept ${applicant.fullName || "this applicant"}?`)) return;
    await updateStatus(applicant, "accepted");
  };

  const handleReject = async (applicant) => {
    if (!window.confirm(`Reject ${applicant.fullName || "this applicant"}?`)) return;
    await updateStatus(applicant, "rejected");
  };

  // schedule interview
  const handleScheduleSave = async () => {
    if (!selectedApplicant) return;
    if (!scheduleDate || !scheduleTime) {
      alert("Please choose a date and time.");
      return;
    }
    try {
      const dt = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const scheduledAt = Timestamp.fromDate(dt);
      await updateStatus(selectedApplicant, "scheduled", scheduledAt);
    } catch (err) {
      console.error("handleScheduleSave err:", err);
      alert("Failed to schedule interview.");
    }
  };

  const handleView = (applicant) => openView(applicant);
  const handleViewProfile = (applicant) => setShowProfileModal(applicant);
  const handleViewResume = (applicant) => setShowResumeModal(applicant);

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

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        .al-container { padding: 0; }
        .al-header { margin-bottom: 24px; }
        .al-title { font-size: 24px; font-weight: 800; color: #12263b; margin: 0 0 8px 0; }
        .al-subtitle { font-size: 14px; color: #6c757d; margin: 0; }
        .al-controls { display:flex; gap:12px; margin-bottom:20px; align-items:center; flex-wrap:wrap; }
        .al-search-input { padding:10px 14px; border-radius:10px; border:1px solid #eef4fb; min-width:220px; }
        .al-filter-btn { padding:8px 12px; border-radius:8px; border:1px solid #eef4fb; background:#fff; cursor:pointer; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(6,12,24,0.6); display:flex; align-items:center; justify-content:center; z-index:2000; padding:20px; }
        .modal { width:100%; max-width:820px; background:#fff; border-radius:12px; box-shadow:0 24px 80px rgba(2,6,23,0.4); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
        .modal-body { padding: 18px; overflow-y:auto; }
        .modal-footer { padding: 12px 18px; border-top:1px solid #f0f4f9; display:flex; gap:8px; justify-content:flex-end; }
      `}</style>

      <div className="al-container">
        <div className="al-header">
          <h2 className="al-title">Applications</h2>
          <p className="al-subtitle">Manage applications for your posted jobs</p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px", minWidth: 160, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eef4fb", boxShadow: "0 8px 24px rgba(2,6,23,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0d6efd" }}>{applications.length}</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, fontWeight: 700 }}>Total</div>
          </div>

          <div style={{ flex: "1 1 160px", minWidth: 160, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eef4fb", boxShadow: "0 8px 24px rgba(2,6,23,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#ffc107" }}>{applications.filter((a) => a.status === "pending").length}</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, fontWeight: 700 }}>Pending</div>
          </div>

          <div style={{ flex: "1 1 160px", minWidth: 160, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eef4fb", boxShadow: "0 8px 24px rgba(2,6,23,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#17a2b8" }}>{applications.filter((a) => a.status === "scheduled").length}</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, fontWeight: 700 }}>Scheduled</div>
          </div>

          <div style={{ flex: "1 1 160px", minWidth: 160, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eef4fb", boxShadow: "0 8px 24px rgba(2,6,23,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#28a745" }}>{applications.filter((a) => a.status === "accepted").length}</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, fontWeight: 700 }}>Accepted</div>
          </div>

          <div style={{ flex: "1 1 160px", minWidth: 160, background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #eef4fb", boxShadow: "0 8px 24px rgba(2,6,23,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc3545" }}>{applications.filter((a) => a.status === "rejected").length}</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, fontWeight: 700 }}>Rejected</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px", minWidth: 240 }}>
            <input
              className="al-search-input"
              placeholder="Search name, email, job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #eef4fb",
                fontSize: 14,
                boxShadow: "inset 0 1px 3px rgba(2,6,23,0.03)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {["all", "pending", "scheduled", "accepted", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="al-filter-btn"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: filterStatus === s ? "none" : "1px solid #eef4fb",
                  background: filterStatus === s ? "#0d6efd" : "#fff",
                  color: filterStatus === s ? "#fff" : "#6c757d",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  minWidth: 96,
                  textAlign: "center",
                }}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 18,
            alignItems: "stretch",
            width: "100%",
          }}
        >
          {loading ? (
            <SkeletonList count={4} />
          ) : filteredApplications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6c757d" }}>
              {applications.length === 0 ? "No applications yet." : "No applications match filters."}
            </div>
          ) : (
            filteredApplications.map((app) => (
              <ApplicantCard
                key={app.id}
                applicant={app}
                jobType={jobs[app.jobId]?.jobType || "full-time"}
                onView={() => handleView(app)}
                onAccept={() => handleAccept(app)}
                onReject={() => handleReject(app)}
                onSchedule={() => handleView(app)}
                onViewProfile={() => handleViewProfile(app)}
                onViewResume={() => handleViewResume(app)}
              />
            ))
          )}
        </div>
      </div>

      {/* View Modal */}
      {selectedApplicant && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !actionLoading && setSelectedApplicant(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0f4f9", background: "#fbfdff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 800, color: "#12263b" }}>
                    {selectedApplicant.fullName || "Applicant"}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#6c757d" }}>
                    {selectedApplicant.positionApplied || "Position"}
                  </p>
                </div>
                <button
                  onClick={() => !actionLoading && setSelectedApplicant(null)}
                  disabled={actionLoading}
                  style={{ background: "none", border: "none", fontSize: 28, cursor: actionLoading ? "not-allowed" : "pointer", color: "#adb5bd", padding: 0, opacity: actionLoading ? 0.5 : 1 }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>

              {/* Left Column - Applicant Info */}
              <div style={{ minWidth: 0 }}>
                {/* Contact Info Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Email</div>
                    <div style={{ fontSize: 13, color: "#12263b", fontWeight: 600, wordBreak: "break-word" }}>
                      {selectedApplicant.email || "—"}
                    </div>
                  </div>
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Contact</div>
                    <div style={{ fontSize: 13, color: "#12263b", fontWeight: 600 }}>
                      {selectedApplicant.contactNumber || selectedApplicant.phone || "—"}
                    </div>
                  </div>
                </div>

                {/* Status & Applied Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Status</div>
                    <span style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      backgroundColor: selectedApplicant.status === "pending" ? "#fff3cd" : selectedApplicant.status === "scheduled" ? "#cfe2ff" : selectedApplicant.status === "accepted" ? "#d1e7dd" : "#f8d7da",
                      color: selectedApplicant.status === "pending" ? "#856404" : selectedApplicant.status === "scheduled" ? "#084298" : selectedApplicant.status === "accepted" ? "#0f5132" : "#842029",
                    }}>
                      {(selectedApplicant.status || "pending").charAt(0).toUpperCase() + (selectedApplicant.status || "pending").slice(1)}
                    </span>
                  </div>
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Applied</div>
                    <div style={{ fontSize: 13, color: "#12263b", fontWeight: 600 }}>
                      {selectedApplicant.appliedAt ? (selectedApplicant.appliedAt.toDate ? selectedApplicant.appliedAt.toDate().toLocaleDateString() : new Date(selectedApplicant.appliedAt).toLocaleDateString()) : "—"}
                    </div>
                  </div>
                </div>

                {/* Resume Link */}
                {selectedApplicant.resumeLink && (
                  <div style={{ background: "#f0f7ff", padding: 14, borderRadius: 10, border: "1px solid #b6e3ff", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#0d6efd", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Resume</div>
                    <a
                      href={selectedApplicant.resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#0d6efd",
                        color: "#fff",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Open Resume
                    </a>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplicant.coverLetter && (
                  <div style={{ background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #eef4fb" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>💬 Cover Letter</div>
                    <div style={{ fontSize: 13, color: "#44566a", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {selectedApplicant.coverLetter}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Actions (Only show if status is pending) */}
              <div>
                {selectedApplicant.status === "pending" ? (
                  <>
                    {/* Schedule Section */}
                    <div style={{ background: "#f0f7ff", padding: 16, borderRadius: 12, border: "1px solid #b6e3ff", marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0d6efd", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        Schedule Interview
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, color: "#084298", fontWeight: 700, display: "block", marginBottom: 6 }}>Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            disabled={actionLoading}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "1.5px solid #b6e3ff",
                              fontSize: 13,
                              background: "#fff",
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: "#084298", fontWeight: 700, display: "block", marginBottom: 6 }}>Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            disabled={actionLoading}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "1.5px solid #b6e3ff",
                              fontSize: 13,
                              background: "#fff",
                              opacity: actionLoading ? 0.6 : 1,
                            }}
                          />
                        </div>
                        <button
                          onClick={handleScheduleSave}
                          disabled={actionLoading}
                          style={{
                            padding: "11px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "#0d6efd",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: actionLoading ? "not-allowed" : "pointer",
                            transition: "all 0.12s ease",
                            marginTop: 4,
                            opacity: actionLoading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => !actionLoading && (e.target.style.transform = "translateY(-1px)")}
                          onMouseLeave={(e) => (e.target.style.transform = "none")}
                        >
                          {actionLoading ? "Saving..." : "Save Schedule"}
                        </button>
                      </div>
                    </div>

                    {/* Accept Section */}
                    <div style={{ background: "#f0faf7", padding: 16, borderRadius: 12, border: "1px solid #d4edda", marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f5132", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        Accept
                      </div>
                      <button
                        onClick={() => handleAccept(selectedApplicant)}
                        disabled={actionLoading}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "#28a745",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          transition: "all 0.12s ease",
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => !actionLoading && (e.target.style.transform = "translateY(-1px)")}
                        onMouseLeave={(e) => (e.target.style.transform = "none")}
                      >
                        {actionLoading ? "Processing..." : "Accept Applicant"}
                      </button>
                    </div>

                    {/* Reject Section */}
                    <div style={{ background: "#fff5f6", padding: 16, borderRadius: 12, border: "1px solid #f5c2c7" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#c82333", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        Reject
                      </div>
                      <button
                        onClick={() => handleReject(selectedApplicant)}
                        disabled={actionLoading}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "#dc3545",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          transition: "all 0.12s ease",
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => !actionLoading && (e.target.style.transform = "translateY(-1px)")}
                        onMouseLeave={(e) => (e.target.style.transform = "none")}
                      >
                        {actionLoading ? "Processing..." : "Reject Applicant"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Display status message when not pending */
                  <div style={{
                    background: selectedApplicant.status === "accepted" ? "#d4edda" : selectedApplicant.status === "rejected" ? "#f8d7da" : "#d1ecf1",
                    padding: 16,
                    borderRadius: 12,
                    border: selectedApplicant.status === "accepted" ? "1px solid #c3e6cb" : selectedApplicant.status === "rejected" ? "1px solid #f5c6cb" : "1px solid #bee5eb",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontSize: 32,
                      marginBottom: 12,
                    }}>
                      {selectedApplicant.status === "accepted" ? "" : selectedApplicant.status === "rejected" ? "" : ""}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: selectedApplicant.status === "accepted" ? "#0f5132" : selectedApplicant.status === "rejected" ? "#842029" : "#0c5460",
                      marginBottom: 8,
                    }}>
                      {selectedApplicant.status === "accepted" ? "Accepted" : selectedApplicant.status === "rejected" ? "Rejected" : "Scheduled"}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: selectedApplicant.status === "accepted" ? "#0f5132" : selectedApplicant.status === "rejected" ? "#842029" : "#0c5460",
                    }}>
                      {selectedApplicant.status === "scheduled" && selectedApplicant.scheduledAt && (
                        `Interview: ${new Date(selectedApplicant.scheduledAt.toDate ? selectedApplicant.scheduledAt.toDate() : selectedApplicant.scheduledAt).toLocaleString()}`
                      )}
                      {selectedApplicant.status === "accepted" && "This applicant has been accepted"}
                      {selectedApplicant.status === "rejected" && "This applicant has been rejected"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ background: "#fbfdff" }}>
              {/* <button
                onClick={() => setSelectedApplicant(null)}
                disabled={actionLoading}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #eef4fb",
                  background: "#fff",
                  color: "#6c757d",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.5 : 1,
                }}
              >
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          role="dialog"
          aria-modal="true"
          onClick={() => setShowProfileModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "700px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e9ecef", background: "#fbfdff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#12263b" }}>
                👤 {showProfileModal.fullName || "Applicant"} Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(null)}
                style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#adb5bd", padding: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Personal Info */}
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 16, marginTop: 0 }}>Personal Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                  <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Full Name</div>
                  <div style={{ fontSize: 15, color: "#12263b", fontWeight: 700 }}>{showProfileModal.fullName || "—"}</div>
                </div>
                <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                  <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Email</div>
                  <div style={{ fontSize: 13, color: "#0d6efd", fontWeight: 600, wordBreak: "break-all" }}>{showProfileModal.email || "—"}</div>
                </div>
                <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                  <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Contact Number</div>
                  <div style={{ fontSize: 15, color: "#12263b", fontWeight: 700 }}>{showProfileModal.contactNumber || "—"}</div>
                </div>
                <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                  <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Applied Date</div>
                  <div style={{ fontSize: 14, color: "#12263b", fontWeight: 600 }}>{formatDate(showProfileModal.appliedAt)}</div>
                </div>
                {showProfileModal.raw?.age && (
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Age</div>
                    <div style={{ fontSize: 15, color: "#12263b", fontWeight: 700 }}>{showProfileModal.raw.age}</div>
                  </div>
                )}
                {showProfileModal.raw?.gender && (
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Gender</div>
                    <div style={{ fontSize: 15, color: "#12263b", fontWeight: 700 }}>{showProfileModal.raw.gender}</div>
                  </div>
                )}
              </div>

              {/* Location - COMBINED BARANGAY + ADDRESS */}
              {(showProfileModal.raw?.barangay || showProfileModal.raw?.address || showProfileModal.raw?.location) && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 12 }}>Location</h3>
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}> Address</div>
                    <div style={{ fontSize: 14, color: "#12263b", fontWeight: 600, lineHeight: 1.5 }}>
                      {showProfileModal.raw?.barangay && showProfileModal.raw?.address ? (
                        <>
                          {showProfileModal.raw.barangay}, {showProfileModal.raw.address}
                        </>
                      ) : showProfileModal.raw?.barangay ? (
                        showProfileModal.raw.barangay
                      ) : showProfileModal.raw?.address ? (
                        showProfileModal.raw.address
                      ) : showProfileModal.raw?.location ? (
                        showProfileModal.raw.location
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Professional Info */}
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 16 }}>Professional Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                  <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Position Applied</div>
                  <div style={{ fontSize: 15, color: "#0d6efd", fontWeight: 700 }}>{showProfileModal.positionApplied || "—"}</div>
                </div>
                {showProfileModal.raw?.desiredJob && (
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Desired Position</div>
                    <div style={{ fontSize: 14, color: "#12263b", fontWeight: 600 }}>{showProfileModal.raw.desiredJob}</div>
                  </div>
                )}
                {showProfileModal.raw?.experience && (
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Experience</div>
                    <div style={{ fontSize: 15, color: "#12263b", fontWeight: 700 }}>{showProfileModal.raw.experience} years</div>
                  </div>
                )}
                {showProfileModal.raw?.education && (
                  <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                    <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Education</div>
                    <div style={{ fontSize: 14, color: "#12263b", fontWeight: 600 }}>{showProfileModal.raw.education}</div>
                  </div>
                )}
              </div>

              {/* Skills */}
              {showProfileModal.raw?.skills && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 12 }}>Skills</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    {showProfileModal.raw.skills.split(",").map((skill, i) => (
                      <span key={i} style={{ background: "#e9f4ff", color: "#0d6efd", padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid #d4e3ff" }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Cover Letter */}
              {showProfileModal.coverLetter && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 12 }}>Cover Letter</h3>
                  <div style={{ background: "#f8f9fa", padding: 14, borderRadius: 10, border: "1px solid #e9ecef", fontSize: 13, color: "#44566a", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: "250px", overflow: "auto", marginBottom: 20 }}>
                    {showProfileModal.coverLetter}
                  </div>
                </>
              )}

              {/* Company Applied For */}
              {showProfileModal.companyName && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#222", marginBottom: 12 }}>Job Details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                      <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Company</div>
                      <div style={{ fontSize: 14, color: "#12263b", fontWeight: 600 }}>{showProfileModal.companyName}</div>
                    </div>
                    {showProfileModal.companyAddress && (
                      <div style={{ background: "#fbfdff", padding: 14, borderRadius: 10, border: "1px solid #e6f0ff" }}>
                        <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Company Address</div>
                        <div style={{ fontSize: 13, color: "#44566a", fontWeight: 600 }}>{showProfileModal.companyAddress}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e9ecef", background: "#fbfdff", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {/* <button
                onClick={() => setShowProfileModal(null)}
                style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #eef4fb", background: "#fff", color: "#6c757d", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
              >
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* RESUME MODAL */}
      {showResumeModal && showResumeModal.resumeLink && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          role="dialog"
          aria-modal="true"
          onClick={() => setShowResumeModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e9ecef", background: "#fbfdff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#12263b" }}>
                📄 {showResumeModal.fullName || "Applicant"} Resume
              </h2>
              <button
                onClick={() => setShowResumeModal(null)}
                style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#adb5bd", padding: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8f9fa",
              overflow: "hidden",
            }}>
              {showResumeModal.resumeLink.startsWith("data:application/pdf") ? (
                <iframe
                  srcDoc={`<!DOCTYPE html>
                    <html>
                    <head>
                      <style>
                        body { margin: 0; padding: 0; overflow: auto; }
                        embed { width: 100vw; height: 100vh; border: none; }
                      </style>
                    </head>
                    <body>
                      <embed src="${showResumeModal.resumeLink}" type="application/pdf" />
                    </body>
                    </html>`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  title="Resume PDF"
                />
              ) : showResumeModal.resumeLink.startsWith("data:") ? (
                showResumeModal.resumeName?.endsWith(".pdf") ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html>
                      <html>
                      <head>
                        <style>
                          body { margin: 0; padding: 0; overflow: auto; }
                          embed { width: 100vw; height: 100vh; border: none; }
                        </style>
                      </head>
                      <body>
                        <embed src="${showResumeModal.resumeLink}" type="application/pdf" />
                      </body>
                      </html>`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    title="Resume PDF"
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "auto" }}>
                    <img
                      src={showResumeModal.resumeLink}
                      alt="Resume"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  </div>
                )
              ) : (
                <iframe
                  src={showResumeModal.resumeLink}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  title="Resume"
                  allow="fullscreen"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e9ecef", background: "#fbfdff", display: "flex", gap: 10, justifyContent: "space-between", flexShrink: 0 }}>
              <button
                onClick={() => {
                  try {
                    const link = document.createElement("a");
                    link.href = showResumeModal.resumeLink;
                    link.download = showResumeModal.resumeName || "resume.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (err) {
                    console.error("Download error:", err);
                    alert("Error downloading file.");
                  }
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#0d6efd",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Download Resume
              </button>
              {/* <button
                onClick={() => setShowResumeModal(null)}
                style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #eef4fb", background: "#fff", color: "#6c757d", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
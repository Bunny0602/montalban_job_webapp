import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const JobHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); 
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ===== FETCH ALL JOBS =====
  useEffect(() => {
    const q = query(collection(db, "jobs"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const jobList = [];

        for (const docSnap of snapshot.docs) {
          const jobData = docSnap.data();

          let employerData = {};

          try {
            // Fetch employer info from users collection
            const employerQuery = query(
              collection(db, "users"),
              where("uid", "==", jobData.employerId)
            );
            const employerDocSnap = await getDocs(employerQuery);

            if (!employerDocSnap.empty) {
              const userData = employerDocSnap.docs[0].data();
              employerData = {
                companyName: userData.companyName || userData.fullName || "N/A",
                contactNumber: userData.contactNumber || userData.phone || "",
                email: userData.email || "",
              };
            } else {
              // Fallback from job data
              employerData = {
                companyName: jobData.companyName || "N/A",
                contactNumber: jobData.contactNumber || "",
                email: jobData.email || "",
              };
            }
          } catch (err) {
            console.warn("Error fetching employer:", err);
            employerData = {
              companyName: jobData.companyName || "N/A",
              contactNumber: jobData.contactNumber || "",
              email: jobData.email || "",
            };
          }

          jobList.push({
            id: docSnap.id,
            ...jobData,
            employerInfo: employerData,
          });
        }

        // Sort by date (newest first)
        jobList.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setJobs(jobList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching jobs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ===== APPLY FILTERS & SEARCH (with useMemo) =====
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.approvalStatus === filterStatus);
    }

    // Search by job title or company
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.jobTitle?.toLowerCase().includes(q) ||
          job.employerInfo?.companyName?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [jobs, filterStatus, searchQuery]);

  // ===== FORMAT DATE =====
  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      if (ts.toDate)
        return new Date(ts.toDate()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      if (ts.seconds)
        return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      return new Date(ts).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // ===== GET STATUS STYLING =====
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return {
          bg: "#d4edda",
          border: "#c3e6cb",
          text: "#155724",
          icon: "",
          label: "Approved",
        };
      case "rejected":
        return {
          bg: "#f8d7da",
          border: "#f5c6cb",
          text: "#721c24",
          icon: "",
          label: "Rejected",
        };
      case "pending":
        return {
          bg: "#fff3cd",
          border: "#ffe6b3",
          text: "#856404",
          icon: "",
          label: "Pending",
        };
      default:
        return {
          bg: "#e2e3e5",
          border: "#d3d3d5",
          text: "#383d41",
          icon: "•",
          label: "Unknown",
        };
    }
  };

  // ===== OPEN DETAIL MODAL =====
  const openJobDetail = (job) => {
    setSelectedJobDetail(job);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedJobDetail(null);
    setShowDetailModal(false);
  };

  // ===== CALCULATE STATS =====
  const stats = {
    total: jobs.length,
    approved: jobs.filter((j) => j.approvalStatus === "approved").length,
    rejected: jobs.filter((j) => j.approvalStatus === "rejected").length,
    pending: jobs.filter((j) => j.approvalStatus === "pending").length,
  };

  return (
    <div className="job-history-root">
      <style>{`
        .job-history-root {
          padding: 20px;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #12263b;
          background: #fbfdff;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .job-history-root {
            padding-top: 70px;
          }
        }

        .history-header {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .history-title-group {
          flex: 1;
        }

        .history-title {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #000000;  // ✅ Changed from #0d6efd to black
        }

        .history-subtitle {
          color: #6c757d;
          font-size: 13px;
          margin: 4px 0 0 0;
        }

        .history-icon {
          font-size: 32px;
          opacity: 0.8;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-box {
          background: #fff;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #eef4fb;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.12s ease;
        }

        .stat-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #0d6efd;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-top: 6px;
        }

        .controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          margin-bottom: 24px;
          align-items: end;
        }

        .search-container {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid #eef4fb;
          border-radius: 10px;
          padding: 10px 14px;
          transition: all 0.14s ease;
        }

        .search-container:focus-within {
          border-color: #0d6efd;
          box-shadow: 0 8px 20px rgba(13, 110, 253, 0.12);
        }

        .search-container input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          background: transparent;
          color: #12263b;
          padding: 0;
          margin: 0;
        }

        .search-container input::placeholder {
          color: #adb5bd;
        }

        .search-icon {
          color: #6c757d;
          margin-right: 8px;
          font-size: 16px;
          flex-shrink: 0;
        }

        .filter-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 14px;
          border: 1.5px solid #eef4fb;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          color: #6c757d;
          transition: all 0.12s ease;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: #0d6efd;
          background: #f7fbff;
          color: #0d6efd;
        }

        .filter-btn.active {
          background: #0d6efd;
          color: #fff;
          border-color: #0d6efd;
          box-shadow: 0 8px 20px rgba(13, 110, 253, 0.18);
        }

        .jobs-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .job-card {
          background: #fff;
          border: 1px solid #eef4fb;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.14s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
        }

        .job-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
          border-color: #0d6efd;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #12263b;
          line-height: 1.3;
          flex: 1;
        }

        .status-badge {
          padding: 6px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
          border: 1.5px solid;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-item {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: #6c757d;
        }

        .meta-label {
          font-weight: 700;
          color: #44566a;
          min-width: 70px;
        }

        .meta-value {
          color: #12263b;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-description {
          font-size: 13px;
          color: #44566a;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          padding-top: 4px;
          border-top: 1px solid #eef4fb;
        }

        .card-footer {
          display: flex;
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid #eef4fb;
          flex-wrap: wrap;
        }

        .card-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #f3fbff;
          border-radius: 4px;
          font-size: 11px;
          color: #0b6b3a;
          font-weight: 600;
          border: 1px solid #e6f7ef;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: #12263b;
        }

        .empty-text {
          margin: 0;
          font-size: 13px;
          color: #6c757d;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .skeleton-card {
          background: #fff;
          border: 1px solid #eef4fb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .skeleton-line {
          height: 12px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
        }

        .skeleton-title {
          height: 18px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 12, 24, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.14s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          width: 100%;
          max-width: 720px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.4);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.18s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #eef4fb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #12263b;
        }

        .modal-body {
          padding: 18px 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #eef4fb;
          justify-content: flex-end;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.12s ease;
        }

        .btn-close:hover {
          color: #12263b;
        }

        .btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.12s;
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid #eef4fb;
          color: #12263b;
        }

        .btn-ghost:hover {
          background: #fbfdff;
          border-color: #0d6efd;
        }

        .detail-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .detail-label {
          font-weight: 800;
          color: #12263b;
          min-width: 100px;
        }

        .detail-value {
          color: #44566a;
          flex: 1;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .history-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .controls {
            grid-template-columns: 1fr;
          }

          .jobs-container {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .card-header {
            flex-direction: column;
          }

          .modal {
            max-width: 100%;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="history-header">
        <div className="history-title-group">
          <h1 className="history-title">Job Records</h1>
          <p className="history-subtitle">View and manage all job postings</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        {/* ✅ Removed Total Jobs stat box */}
        <div className="stat-box">
          <p className="stat-value" style={{ color: "#52d273" }}>
            {stats.approved}
          </p>
          <p className="stat-label">Approved</p>
        </div>
        <div className="stat-box">
          <p className="stat-value" style={{ color: "#dc3545" }}>
            {stats.rejected}
          </p>
          <p className="stat-label">Rejected</p>
        </div>
        <div className="stat-box">
          <p className="stat-value" style={{ color: "#856404" }}>
            {stats.pending}
          </p>
          <p className="stat-label">Pending</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls">
        <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All Jobs
          </button>
          <button
            className={`filter-btn ${filterStatus === "approved" ? "active" : ""}`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
        </div>
      </div>

      {/* JOBS LIST */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line" style={{ width: "80%" }}></div>
              <div className="skeleton-line" style={{ width: "60%" }}></div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <p className="empty-title">No jobs found</p>
          <p className="empty-text">
            {searchQuery
              ? "Try a different search query"
              : filterStatus !== "all"
              ? `No ${filterStatus} jobs yet`
              : "No jobs have been posted yet"}
          </p>
        </div>
      ) : (
        <div className="jobs-container">
          {filteredJobs.map((job) => {
            const statusInfo = getStatusColor(job.approvalStatus);
            return (
              <div
                key={job.id}
                className="job-card"
                onClick={() => openJobDetail(job)}
              >
                <div className="card-header">
                  <h3 className="card-title">{job.jobTitle}</h3>
                  <div
                    className="status-badge"
                    style={{
                      background: statusInfo.bg,
                      borderColor: statusInfo.border,
                      color: statusInfo.text,
                    }}
                  >
                    {statusInfo.icon} {statusInfo.label}
                  </div>
                </div>

                <div className="card-meta">
                  <div className="meta-item">
                    <span className="meta-label">Company:</span>
                    <span className="meta-value">
                      {job.employerInfo?.companyName || "N/A"}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">
                      {job.jobType === "part-time" ? "Part-time" : "Full-time"}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Submitted:</span>
                    <span className="meta-value">
                      {formatDate(job.createdAt || job.postedDate)}
                    </span>
                  </div>
                </div>

                {job.jobDescription && (
                  <div className="card-description">{job.jobDescription}</div>
                )}

                <div className="card-footer">
                  {job.experience && (
                    <div className="card-tag">{job.experience}</div>
                  )}
                  {job.barangay && (
                    <div className="card-tag">{job.barangay}</div>
                  )}
                  {job.jobType && (
                    <div className="card-tag">
                      {" "}
                      {job.jobType === "part-time"
                        ? "Part-time"
                        : "Full-time"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedJobDetail && (
        <div
          className="modal-overlay"
          onClick={closeDetailModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  {selectedJobDetail.jobTitle}
                </h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                  {selectedJobDetail.employerInfo?.companyName || "N/A"}
                </div>
              </div>
              <button
                className="btn-close"
                onClick={closeDetailModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* JOB IMAGE - DISPLAY IF UPLOADED */}
              {selectedJobDetail.jobImage ? (
                <div style={{ marginBottom: 16 }}>
                  <img 
                    src={selectedJobDetail.jobImage} 
                    alt={selectedJobDetail.jobTitle} 
                    style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, border: "1px solid #eef4fb" }} 
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16, width: "100%", height: 200, background: "linear-gradient(135deg, #eaf7ef, #f7fbff)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#0d6efd", fontSize: 64, border: "1px solid #e6f0ff" }}>
                  💼
                </div>
              )}

              <div
                style={{
                  padding: 12,
                  background: getStatusColor(selectedJobDetail.approvalStatus).bg,
                  borderLeft: `4px solid ${getStatusColor(selectedJobDetail.approvalStatus).border}`,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    color: getStatusColor(selectedJobDetail.approvalStatus).text,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {getStatusColor(selectedJobDetail.approvalStatus).icon}{" "}
                  {getStatusColor(selectedJobDetail.approvalStatus).label}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Job Title:</div>
                <div className="detail-value">
                  {selectedJobDetail.jobTitle}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Company:</div>
                <div className="detail-value">
                  {selectedJobDetail.employerInfo?.companyName || "N/A"}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Type:</div>
                <div className="detail-value">
                  {selectedJobDetail.jobType === "part-time"
                    ? "Part-time"
                    : "Full-time"}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Experience:</div>
                <div className="detail-value">
                  {selectedJobDetail.experience || "Not specified"}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Location:</div>
                <div className="detail-value">
                  {selectedJobDetail.barangay || "Not specified"},{" "}
                  {selectedJobDetail.address || ""}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Submitted:</div>
                <div className="detail-value">
                  {formatDate(
                    selectedJobDetail.createdAt || selectedJobDetail.postedDate
                  )}
                </div>
              </div>

              {selectedJobDetail.rejectionReason && (
                <div className="detail-row">
                  <div className="detail-label">Rejection Reason:</div>
                  <div className="detail-value">
                    {selectedJobDetail.rejectionReason}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #eef4fb" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6c757d",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Description
                </div>
                <div style={{ fontSize: 13, color: "#44566a", lineHeight: 1.6 }}>
                  {selectedJobDetail.jobDescription || "No description provided."}
                </div>
              </div>

              {selectedJobDetail.skills && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#6c757d",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Required Skills
                  </div>
                  <div style={{ fontSize: 13, color: "#44566a", lineHeight: 1.6 }}>
                    {selectedJobDetail.skills}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory;
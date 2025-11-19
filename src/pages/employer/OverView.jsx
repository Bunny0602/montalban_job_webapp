import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";

const Overview = ({ setActive, setEditingJobId }) => {
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const jobsQuery = query(collection(db, "jobs"), where("employerId", "==", user.uid));
        const jobsSnap = await getDocs(jobsQuery);
        const jobList = jobsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));

        setTotalJobs(jobList.length);

        const appsSnap = await getDocs(collection(db, "applications"));
        const apps = appsSnap.docs.map(d => d.data() || {});
        
        // FIX: EXCLUDE rejected applications from count
        const myApps = apps.filter(app => 
          jobList.some(j => j.id === app.jobId) && 
          app.status !== "rejected" // Don't count rejected applicants
        );
        setTotalApplicants(myApps.length);

        // FIX: EXCLUDE rejected applications from per-job count
        const appCountByJob = myApps.reduce((acc, a) => {
          acc[a.jobId] = (acc[a.jobId] || 0) + 1;
          return acc;
        }, {});

        const sorted = [...jobList].sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });

        setRecentJobs(sorted.slice(0, 5).map(j => ({
          ...j,
          applicants: appCountByJob[j.id] || 0, // Now excludes rejected
          jobTitle: j.jobTitle || "Untitled",
          jobDescription: j.jobDescription || "",
          jobImage: j.jobImage || "",
          experience: j.experience || "",
          skills: j.skills || "",
          contactNumber: j.contactNumber || "",
          address: j.address || "",
          barangay: j.barangay || "",
          applicantLimit: j.applicantLimit || 0,
          jobStatus: j.jobStatus || "open",
          jobType: j.jobType || "full-time",
        })));
      } catch (err) {
        console.error("Error loading overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [user]);

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

  const openJobModal = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    setShowJobModal(false);
  };

  const handlePostNew = () => {
    setEditingJobId(null);
    setActive("Post Job");
  };

  const handleEditJob = (jobId) => {
    setEditingJobId(jobId);
    setActive("Post Job");
  };

  return (
    <div className="overview-root">
      <style>{`
        .overview-root { 
          padding: 20px; 
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; 
          color: #12263b; 
        }

        .overview-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 12px; 
          margin-bottom: 18px; 
        }

        .overview-title { 
          margin:0; 
          font-size:20px; 
          font-weight:800; 
          color:#000; 
        }

        .overview-sub { 
          color:#6c757d; 
          font-size:13px; 
          margin:0; 
        }

        /* Improved Skeleton Loading */
        .skeleton-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:20px; }
        .skeleton-stat { background:#fff; padding:18px; border-radius:12px; border:1px solid #eef4fb; overflow:hidden; }
        .skeleton-stat-label { height:12px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; border-radius:6px; margin-bottom:10px; width:60%; }
        .skeleton-stat-value { height:24px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; border-radius:6px; margin-bottom:8px; }
        .skeleton-stat-sub { height:12px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; border-radius:6px; width:80%; }

        .skeleton-recent { background:#fff; padding:16px; border-radius:12px; border:1px solid #eef4fb; }
        .skeleton-recent-title { height:16px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; border-radius:6px; margin-bottom:12px; width:150px; }
        .skeleton-row { display:flex; gap:12px; padding:10px; margin-bottom:8px; }
        .skeleton-avatar { width:48px; height:48px; border-radius:10px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; flex-shrink:0; }
        .skeleton-meta { flex:1; display:flex; flex-direction:column; gap:6px; }
        .skeleton-text { height:14px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%); background-size:200% 100%; animation:shimmer 2s infinite; border-radius:6px; }
        .skeleton-text.short { width:60%; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .stats-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:20px; }
        .stat-card { background:#fff; padding:18px; border-radius:12px; box-shadow: 0 8px 28px rgba(13,110,253,0.04); border:1px solid #eef4fb; display:flex; flex-direction:column; gap:8px; min-height:110px; justify-content:space-between; transition: transform .12s, box-shadow .12s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(13,110,253,0.08); }
        .stat-label { font-size:13px; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; }
        .stat-value { font-size:24px; font-weight:800; color:#12263b; }
        .stat-sub { font-size:12px; color:#6c757d; }

        .recent-card { background:#fff; padding:16px; border-radius:12px; border:1px solid #eef4fb; box-shadow: 0 8px 28px rgba(2,6,23,0.04); }
        .recent-title { margin:0 0 12px 0; font-size:16px; font-weight:800; color:#12263b; }
        .recent-list { display:flex; flex-direction:column; gap:8px; }
        .job-row { display:flex; gap:12px; align-items:center; justify-content:space-between; padding:12px; border-radius:10px; transition:background .12s, box-shadow .12s; }
        .job-row:hover { background: #fbfdff; box-shadow: 0 4px 12px rgba(13,110,253,0.08); }
        .job-left { display:flex; gap:12px; align-items:center; min-width:0; flex:1; }
        
        .job-avatar { 
          width:48px; 
          height:48px; 
          border-radius:10px; 
          display:flex; 
          align-items:center; 
          justify-content:center; 
          font-weight:800; 
          flex-shrink:0; 
          font-size:24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform .12s, box-shadow .12s;
          background: linear-gradient(135deg, #eaf7ef, #f7fbff);
          color: #0d6efd;
        }

        .job-row:hover .job-avatar {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }

        .job-meta { min-width:0; }
        .job-title { margin:0; font-weight:700; font-size:14px; color:#12263b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .job-sub { margin:0; font-size:12px; color:#6c757d; margin-top:2px; }

        .job-right { display:flex; gap:12px; align-items:center; flex-shrink:0; }
        .badge { padding:6px 8px; border-radius:999px; font-weight:800; font-size:12px; }
        .badge-open { background:#e9f4ff; color:#0d6efd; border:1px solid #d7eefe; }
        .badge-closed { background:#fff5f6; color:#c82333; border:1px solid #fde7ea; }

        .muted { color:#6c757d; font-size:13px; margin:0; }

        .actions { display:flex; gap:8px; align-items:center; }
        .btn { padding:8px 12px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:13px; transition: all .12s; }
        .btn-primary { background:#0d6efd; color:#fff; box-shadow:0 8px 20px rgba(13,110,253,0.18); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow:0 12px 28px rgba(13,110,253,0.24); }
        .btn-ghost { background:transparent; border:1px solid #eef4fb; color:#12263b; }
        .btn-ghost:hover { background:#fbfdff; border-color:#0d6efd; }

        /* Job Details Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6,12,24,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn .14s ease;
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
          box-shadow: 0 24px 80px rgba(2,6,23,0.4);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: slideUp .18s ease;
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

        .job-detail-row { display:flex; gap:8px; margin-bottom:12px; align-items:center; }
        .job-detail-label { font-weight:800; color:#12263b; min-width:100px; }
        .job-detail-value { color:#44566a; flex:1; }

        .skills-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
        .skill-pill { padding:6px 10px; background:#f3fbff; border-radius:999px; font-weight:700; color:#0b6b3a; font-size:12px; border:1px solid #e6f7ef; }

        .empty-state { text-align:center; padding:40px 20px; color:#6c757d; }
        .empty-icon { font-size:48px; margin-bottom:12px; }

        @media (max-width:1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width:680px) {
          .stats-grid { grid-template-columns: 1fr; }
          .skeleton-grid { grid-template-columns: 1fr; }
          .overview-header { flex-direction:column; align-items:flex-start; gap:8px; }
          .actions { flex-direction:column; width:100%; }
          .btn { width:100%; }
          .job-right { flex-direction:column; align-items:flex-start; width:100%; }
          .modal { max-width: 100%; }
          .job-row { flex-direction:column; align-items:flex-start; }
        }
      `}</style>

      <div className="overview-header">
        <div>
          <h2 className="overview-title">Overview</h2>
          <p className="overview-sub">Quick summary of your posted jobs and applicants</p>
        </div>

        <div className="actions">
          {/* <button className="btn btn-ghost">View Candidates</button> */}
          <button 
            className="btn btn-primary"
            onClick={handlePostNew}
            title="Post a new job"
          >
            + Post New Job
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-stat">
                <div className="skeleton-stat-label"></div>
                <div className="skeleton-stat-value"></div>
                <div className="skeleton-stat-sub"></div>
              </div>
            ))}
          </div>

          <div className="skeleton-recent">
            <div className="skeleton-recent-title"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-meta">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid" role="list">
            <div className="stat-card" role="listitem">
              <div className="stat-label">Total Jobs</div>
              <div className="stat-value">{totalJobs}</div>
              <div className="stat-sub">All jobs posted</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Total Applicants</div>
              <div className="stat-value">{totalApplicants}</div>
              <div className="stat-sub">Across all jobs</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Open Jobs</div>
              <div className="stat-value">
                {recentJobs.reduce((acc, j) => acc + ((j.jobStatus || "open") !== "closed" ? 1 : 0), 0) || "—"}
              </div>
              <div className="stat-sub">Accepting applications</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Recent Activity</div>
              <div className="stat-value">{recentJobs.length}</div>
              <div className="stat-sub">Recent jobs shown</div>
            </div>
          </div>

          <div className="recent-card">
            <h3 className="recent-title">Recent Jobs</h3>

            {recentJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💼</div>
                <p className="muted">No recent jobs. Post a job to get applicants.</p>
              </div>
            ) : (
              <div className="recent-list">
                {recentJobs.map((job) => (
                  <div key={job.id} className="job-row" role="article">
                    <div className="job-left">
                      <div className="job-avatar">💼</div>
                      <div className="job-meta">
                        <p className="job-title" title={job.jobTitle}>{job.jobTitle}</p>
                        <p className="job-sub">{formatDate(job.createdAt)} • {job.barangay || "—"}</p>
                      </div>
                    </div>

                    <div className="job-right">
                      <div style={{ textAlign: "right", minWidth: 60 }}>
                        <div style={{ fontWeight:800, fontSize: 16 }}>{job.applicants}</div>
                        <div className="muted" style={{ fontSize:11 }}>Applicants</div>
                      </div>

                      <div className={`badge ${((job.jobStatus || "open") === "closed") ? "badge-closed" : "badge-open"}`}>
                        {((job.jobStatus || "open") === "closed") ? "Closed" : "Open"}
                      </div>

                      <div style={{ width:1, height:28, background:"#eef4fb", borderRadius:4 }} />

                      <div style={{ display:"flex", gap:8 }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => openJobModal(job)}
                          title="View job details"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEditJob(job.id)}
                          title="Edit job"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Job details">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{selectedJob.jobTitle}</h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                  {selectedJob.barangay} • {selectedJob.address}
                </div>
              </div>

              <button 
                onClick={closeJobModal} 
                aria-label="Close job details" 
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#6c757d", padding: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedJob.jobImage ? (
                <div style={{ marginBottom: 12 }}>
                  <img src={selectedJob.jobImage} alt={selectedJob.jobTitle} style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 8 }} />
                </div>
              ) : (
                <div style={{ marginBottom: 12, width: "100%", height: 250, background: "linear-gradient(135deg, #eaf7ef, #f7fbff)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#0d6efd", fontSize: 48 }}>
                  💼
                </div>
              )}

              <div className="job-detail-row">
                <div className="job-detail-label">Status:</div>
                <div className={`badge ${((selectedJob.jobStatus || "open") === "closed") ? "badge-closed" : "badge-open"}`}>
                  {((selectedJob.jobStatus || "open") === "closed") ? "Closed" : "Open"}
                </div>
              </div>

              <div className="job-detail-row">
                <div className="job-detail-label">Experience:</div>
                <div className="job-detail-value">{selectedJob.experience || "Not specified"}</div>
              </div>

              <div className="job-detail-row">
                <div className="job-detail-label">Contact:</div>
                <div className="job-detail-value">{selectedJob.contactNumber || "—"}</div>
              </div>

              {selectedJob.applicantLimit && (
                <div className="job-detail-row">
                  <div className="job-detail-label">Applicants Needed:</div>
                  <div className="job-detail-value">{selectedJob.applicantLimit}</div>
                </div>
              )}

              <div style={{ marginTop: 16, marginBottom: 12 }}>
                <div className="job-detail-label" style={{ marginBottom: 8 }}>Description</div>
                <div style={{ fontSize: 13, color: "#44566a", lineHeight: 1.6 }}>
                  {selectedJob.jobDescription || "No description provided."}
                </div>
              </div>

              {selectedJob.skills && (
                <div style={{ marginTop: 16 }}>
                  <div className="job-detail-label" style={{ marginBottom: 8 }}>Required Skills</div>
                  <div className="skills-row">
                    {selectedJob.skills.split(",").map((s, i) => (
                      <div key={i} className="skill-pill">{s.trim()}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADD: Job Type Badge - moved to bottom after skills */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eef4fb" }}>
                <div className="job-detail-label" style={{ marginBottom: 8 }}>Job Type</div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: 13,
                    backgroundColor: selectedJob.jobType === "part-time" ? "#fff9e6" : "#e9f4ff",
                    color: selectedJob.jobType === "part-time" ? "#cc8800" : "#0d6efd",
                    border: selectedJob.jobType === "part-time" ? "1px solid #ffe6b3" : "1px solid #d4e3ff",
                  }}
                >
                  <span>{selectedJob.jobType === "part-time" ? "" : ""}</span>
                  {selectedJob.jobType === "part-time" ? "Part-time" : "Full-time"}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {/* <button className="btn btn-ghost" onClick={closeJobModal}>Close</button> */}
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleEditJob(selectedJob.id);
                  closeJobModal();
                }}
              >
                Edit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;

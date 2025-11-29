import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const Overview = () => {
  const [stats, setStats] = useState({
    totalEmployers: 0,
    totalJobSeekers: 0,
    totalJobsPosted: 0,
    pendingJobs: 0,
  });

  const [pendingJobsList, setPendingJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);

  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [showEmployerModal, setShowEmployerModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState(null);

  // ===== FETCH ALL STATS =====
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const employersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "employer")));
        const totalEmployers = employersSnap.size;

        const seekersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "job_seeker")));
        const totalJobSeekers = seekersSnap.size;

        // Only count APPROVED jobs as "Total Jobs Posted"
        const approvedJobsSnap = await getDocs(query(collection(db, "jobs"), where("approvalStatus", "==", "approved")));
        const totalJobsPosted = approvedJobsSnap.size;

        const pendingJobsSnap = await getDocs(query(collection(db, "jobs"), where("approvalStatus", "==", "pending")));
        const pendingJobsCount = pendingJobsSnap.size;

        setStats({
          totalEmployers,
          totalJobSeekers,
          totalJobsPosted,
          pendingJobs: pendingJobsCount,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ===== REAL-TIME PENDING JOBS LISTENER WITH COMPLETE EMPLOYER INFO =====
  useEffect(() => {
    const q = query(collection(db, "jobs"), where("approvalStatus", "==", "pending"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const jobs = [];

      for (const docSnap of snapshot.docs) {
        const jobData = docSnap.data();

        let employerData = {};
        let userFilesData = {};
        try {
          // Get employerId from job
          const employerId = jobData.employerId;
          console.log("Job employerId:", employerId);
          console.log("Job data keys:", Object.keys(jobData));

          // Try 1: Fetch from users collection using uid field
          let userDocSnap = await getDocs(
            query(collection(db, "users"), where("uid", "==", employerId))
          );
          
          if (!userDocSnap.empty) {
            const userData = userDocSnap.docs[0].data();
            console.log("✓ Found user via uid query:", userData);
            
            employerData = {
              uid: employerId,
              email: userData.email || "",
              companyName: userData.companyName || userData.fullName || "N/A",
              fullName: userData.fullName || "",
              contactPerson: userData.contactPerson || "",
              contactNumber: userData.contactNumber || userData.phone || "",
              address: userData.address || "",
              barangay: userData.barangay || "",
              positionHiringFor: userData.positionHiringFor || "",
              jobDescription: userData.jobDescription || "",
            };
          } else {
            console.warn("No user found with uid:", employerId);
            
            // Try 2: Use direct document reference
            const directRef = await getDoc(doc(db, "users", employerId));
            if (directRef.exists()) {
              const userData = directRef.data();
              console.log("✓ Found user via direct ref:", userData);
              
              employerData = {
                uid: employerId,
                email: userData.email || "",
                companyName: userData.companyName || userData.fullName || "N/A",
                fullName: userData.fullName || "",
                contactPerson: userData.contactPerson || "",
                contactNumber: userData.contactNumber || userData.phone || "",
                address: userData.address || "",
                barangay: userData.barangay || "",
                positionHiringFor: userData.positionHiringFor || "",
                jobDescription: userData.jobDescription || "",
              };
            } else {
              console.warn("No user found with direct ref either");
              
              // Try 3: Fallback - get data from job document itself
              employerData = {
                uid: employerId,
                email: jobData.email || "",
                companyName: jobData.companyName || jobData.fullName || "N/A",
                fullName: jobData.fullName || "",
                contactPerson: jobData.contactPerson || "",
                contactNumber: jobData.contactNumber || "",
                address: jobData.address || "",
                barangay: jobData.barangay || "",
                positionHiringFor: jobData.positionHiringFor || "",
                jobDescription: jobData.jobDescription || "",
              };
              console.log("Using job data as fallback:", employerData);
            }
          }

          // Fetch user files (logo and documents)
          const filesQuery = query(
            collection(db, "userFiles"), 
            where("userId", "==", employerId)
          );
          const filesQuerySnap = await getDocs(filesQuery);
          
          if (!filesQuerySnap.empty) {
            userFilesData = filesQuerySnap.docs[0].data();
            console.log("✓ Found userFiles via query:", userFilesData);
          } else {
            // Try direct document reference using employerId as doc ID
            const directFilesRef = await getDoc(doc(db, "userFiles", employerId));
            if (directFilesRef.exists()) {
              userFilesData = directFilesRef.data();
              console.log("✓ Found userFiles via direct ref:", userFilesData);
            } else {
              console.warn("No userFiles found for:", employerId);
            }
          }
        } catch (err) {
          console.error("Error fetching employer data:", err);
        }

        jobs.push({
          id: docSnap.id,
          ...jobData,
          employerInfo: employerData,
          userFiles: userFilesData,
        });
      }

      setPendingJobsList(jobs);
    });

    return () => unsubscribe();
  }, []);

  // ===== HANDLE ACCEPT JOB =====
  const handleAcceptJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { approvalStatus: "approved" });
      setSuccessMessage("Job approved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Refresh stats
      const approvedJobsSnap = await getDocs(query(collection(db, "jobs"), where("approvalStatus", "==", "approved")));
      const pendingJobsSnap = await getDocs(query(collection(db, "jobs"), where("approvalStatus", "==", "pending")));
      setStats(prev => ({
        ...prev,
        totalJobsPosted: approvedJobsSnap.size,
        pendingJobs: pendingJobsSnap.size,
      }));
    } catch (err) {
      console.error("Error approving job:", err);
      setErrorMessage("Failed to approve job.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // ===== HANDLE REJECT JOB WITH REASON =====
  const handleRejectJob = async (jobId) => {
    if (!rejectionReason.trim()) {
      setErrorMessage("❌ Please provide a rejection reason.");
      return;
    }

    setActionLoading(jobId);
    try {
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { 
        approvalStatus: "rejected",
        rejectionReason: rejectionReason,
        rejectedAt: new Date(),
      });
      setSuccessMessage("✅ Job rejected successfully!");
      setShowRejectionModal(false);
      setRejectionReason("");
      setRejectingJobId(null);
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Refresh stats
      const pendingJobsSnap = await getDocs(query(collection(db, "jobs"), where("approvalStatus", "==", "pending")));
      setStats(prev => ({
        ...prev,
        pendingJobs: pendingJobsSnap.size,
      }));
    } catch (err) {
      console.error("Error rejecting job:", err);
      setErrorMessage("❌ Failed to reject job.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectionModal = (jobId) => {
    setRejectingJobId(jobId);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  // ===== VIEW JOB DETAILS =====
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  // ===== VIEW EMPLOYER INFO =====
  const handleViewEmployer = (job) => {
    setSelectedEmployer({
      ...job.employerInfo,
      userFiles: job.userFiles,
    });
    setShowEmployerModal(true);
  };

  // ===== FORMAT DATE =====
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

  const closeJobModal = () => {
    setSelectedJob(null);
    setShowJobDetailsModal(false);
  };

  const closeEmployerModal = () => {
    setSelectedEmployer(null);
    setShowEmployerModal(false);
  };

  return (
    <div className="overview-root">
      <style>{`
        .overview-root { padding: 20px; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #12263b; }
        .overview-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; }
        .overview-title { margin:0; font-size:20px; font-weight:800; color:#000; }
        .overview-sub { color:#6c757d; font-size:13px; margin:0; }

        /* Skeleton Loading */
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
          background:linear-gradient(135deg,#e9f4ff,#f7fbff);
          color: #0d6efd;
          overflow: hidden;
        }

        .job-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
        .badge-pending { background:#fff3cd; color:#856404; border:1px solid #ffe6b3; }
        .badge-open { background:#e9f4ff; color:#0d6efd; border:1px solid #d7eefe; }
        .badge-closed { background:#fff5f6; color:#c82333; border:1px solid #fde7ea; }

        .muted { color:#6c757d; font-size:13px; margin:0; }

        .actions { display:flex; gap:8px; align-items:center; }
        .btn { padding:8px 12px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:13px; transition: all .12s; }
        .btn-primary { background:#0d6efd; color:#fff; box-shadow:0 8px 20px rgba(13,110,253,0.18); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow:0 12px 28px rgba(13,110,253,0.24); }
        .btn-ghost { background:transparent; border:1px solid #eef4fb; color:#12263b; }
        .btn-ghost:hover { background:#fbfdff; border-color:#0d6efd; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-accept { background:#d4edda; color:#155724; border:1.5px solid #c3e6cb; }
        .btn-accept:hover:not(:disabled) { background:#c3e6cb; transform: translateY(-1px); }
        .btn-reject { background:#f8d7da; color:#721c24; border:1.5px solid #f5c6cb; }
        .btn-reject:hover:not(:disabled) { background:#f5c6cb; transform: translateY(-1px); }

        /* Modal */
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

        .empty-state { text-align:center; padding:40px 20px; color:#6c757d; }
        .empty-icon { font-size:48px; margin-bottom:12px; }

        .alert-message {
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          border-left: 4px solid;
          animation: slideDown .3s ease;
        }

        .alert-success {
          background: #f0faf7;
          color: #0b6b3a;
          border-left-color: #52d273;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border-left-color: #dc3545;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Employer Info Grid */
        .employer-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .employer-info-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .employer-info-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .employer-info-value {
          font-size: 14px;
          color: #12263b;
          font-weight: 600;
          word-break: break-word;
          line-height: 1.4;
        }

        .employer-info-full {
          grid-column: 1 / -1;
        }

        /* Logo Display */
        .employer-logo-section {
          margin: 16px 0;
          padding: 16px;
          background: #f8fbff;
          border-radius: 10px;
          border: 1px solid #e6f0ff;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .logo-preview {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .logo-name {
          font-size: 12px;
          color: #6c757d;
          font-weight: 700;
        }

        .logo-actions {
          display: flex;
          gap: 8px;
        }

        .btn-view-logo {
          padding: 6px 10px;
          background: #0d6efd;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 700;
          transition: all .12s;
        }

        .btn-view-logo:hover {
          background: #0b5ed7;
          transform: translateY(-1px);
        }

        /* Logo Modal */
        .logo-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2001;
          padding: 20px;
          animation: fadeIn .14s ease;
        }

        .logo-modal {
          background: #fff;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(2,6,23,0.4);
          overflow: hidden;
          animation: slideUp .18s ease;
        }

        .logo-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #eef4fb;
        }

        .logo-modal-body {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 70vh;
          overflow-y: auto;
        }

        .logo-modal-body img {
          max-width: 100%;
          max-height: 100%;
          border-radius: 10px;
          object-fit: contain;
        }

        .logo-modal-footer {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #eef4fb;
          justify-content: flex-end;
        }

        .rejection-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6,12,24,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2001;
          padding: 20px;
          animation: fadeIn .14s ease;
        }

        .rejection-modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 24px 80px rgba(2,6,23,0.4);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp .18s ease;
        }

        .rejection-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #eef4fb;
          background: #fff5f6;
        }

        .rejection-modal-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #c82333;
        }

        .rejection-modal-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rejection-reason-label {
          font-size: 13px;
          color: #12263b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .rejection-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px 14px;
          border: 1.5px solid #f5c6cb;
          border-radius: 10px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          transition: box-shadow .14s, border-color .14s;
        }

        .rejection-textarea:focus {
          box-shadow: 0 8px 20px rgba(220, 53, 69, 0.12);
          border-color: #c82333;
          background: #fffbfc;
        }

        .rejection-textarea::placeholder {
          color: #adb5bd;
        }

        .rejection-modal-footer {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #eef4fb;
          justify-content: flex-end;
        }

        .btn-cancel-rejection {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #eef4fb;
          background: transparent;
          color: #12263b;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all .12s;
        }

        .btn-cancel-rejection:hover {
          background: #fbfdff;
          border-color: #0d6efd;
        }

        .btn-confirm-reject {
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          background: #f8d7da;
          color: #721c24;
          border: 1.5px solid #f5c6cb;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all .12s;
        }

        .btn-confirm-reject:hover:not(:disabled) {
          background: #f5c6cb;
          transform: translateY(-1px);
        }

        .btn-confirm-reject:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

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
          .employer-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="overview-header">
        <div>
          <h2 className="overview-title">Overview</h2>
          <p className="overview-sub">Quick summary of jobs and users</p>
        </div>
      </div>

      {/* ALERTS */}
      {successMessage && <div className="alert-message alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert-message alert-error">{errorMessage}</div>}

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
              <div className="stat-label">Total Employers</div>
              <div className="stat-value">{stats.totalEmployers}</div>
              <div className="stat-sub">Registered employers</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Total Job Seekers</div>
              <div className="stat-value">{stats.totalJobSeekers}</div>
              <div className="stat-sub">Active job seekers</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Total Jobs Posted</div>
              <div className="stat-value">{stats.totalJobsPosted}</div>
              <div className="stat-sub">Approved & public</div>
            </div>

            <div className="stat-card" role="listitem">
              <div className="stat-label">Pending Jobs</div>
              <div className="stat-value">{stats.pendingJobs}</div>
              <div className="stat-sub">Awaiting approval</div>
            </div>
          </div>

          <div className="recent-card">
            <h3 className="recent-title">Pending Job Approvals</h3>

            {pendingJobsList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <p className="muted">No pending jobs. All job posts have been reviewed!</p>
              </div>
            ) : (
              <div className="recent-list">
                {pendingJobsList.map((job) => (
                  <div key={job.id} className="job-row" role="article">
                    <div className="job-left">
                      <div className="job-avatar">
                        {job.userFiles?.photoBase64 ? (
                          <img src={job.userFiles.photoBase64} alt={job.employerInfo?.companyName} />
                        ) : (
                          "💼"
                        )}
                      </div>
                      <div className="job-meta">
                        <p className="job-title" title={job.jobTitle}>{job.jobTitle}</p>
                        <p className="job-sub">{formatDate(job.createdAt || job.postedDate)} • {job.employerInfo?.companyName || "—"}</p>
                      </div>
                    </div>

                    <div className="job-right">
                      <div className="badge badge-pending">Pending</div>

                      <div style={{ width:1, height:28, background:"#eef4fb", borderRadius:4 }} />

                      <div style={{ display:"flex", gap:8, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleViewJobDetails(job)}
                          title="View job details"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleViewEmployer(job)}
                          title="View employer info"
                        >
                          Employer
                        </button>
                        <button
                          className="btn btn-accept"
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={actionLoading === job.id}
                          title="Approve this job"
                        >
                          {actionLoading === job.id ? "..." : "Accept"}
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => openRejectionModal(job.id)}
                          disabled={actionLoading === job.id}
                          title="Reject this job"
                        >
                          {actionLoading === job.id ? "..." : "Reject"}
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
      {showJobDetailsModal && selectedJob && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Job details" onClick={closeJobModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedJob.jobTitle}</h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                  {selectedJob.companyName || "N/A"} • {formatDate(selectedJob.postedDate || selectedJob.createdAt)}
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
              {/* JOB IMAGE - DISPLAY IF UPLOADED */}
              {selectedJob.jobImage ? (
                <div style={{ marginBottom: 16 }}>
                  <img 
                    src={selectedJob.jobImage} 
                    alt={selectedJob.jobTitle} 
                    style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, border: "1px solid #eef4fb" }} 
                  />
                </div>
              ) : (
                <div style={{ marginBottom: 16, width: "100%", height: 200, background: "linear-gradient(135deg, #eaf7ef, #f7fbff)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#0d6efd", fontSize: 64, border: "1px solid #e6f0ff" }}>
                  💼
                </div>
              )}

              <div className="job-detail-row">
                <div className="job-detail-label">Status:</div>
                <div className="badge badge-pending">Pending</div>
              </div>

              <div className="job-detail-row">
                <div className="job-detail-label">Type:</div>
                <div className="job-detail-value">{selectedJob.jobType === "part-time" ? "Part-time" : "Full-time"}</div>
              </div>

              <div className="job-detail-row">
                <div className="job-detail-label">Experience:</div>
                <div className="job-detail-value">{selectedJob.experience || "Not specified"}</div>
              </div>

              <div className="job-detail-row">
                <div className="job-detail-label">Location:</div>
                <div className="job-detail-value">{selectedJob.barangay && selectedJob.address ? `${selectedJob.barangay}, ${selectedJob.address}` : "—"}</div>
              </div>

              {selectedJob.applicantLimit && (
                <div className="job-detail-row">
                  <div className="job-detail-label">Applicant Limit:</div>
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
                  <div style={{ fontSize: 13, color: "#44566a", lineHeight: 1.6 }}>
                    {selectedJob.skills}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {/* <button className="btn btn-ghost" onClick={closeJobModal}>Close</button> */}
            </div>
          </div>
        </div>
      )}

      {/* Employer Info Modal - WITH COMPLETE PROFILE DATA */}
      {showEmployerModal && selectedEmployer && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Employer info" onClick={closeEmployerModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}> {selectedEmployer.companyName || "Employer Info"}</h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                  Complete Employer Profile
                </div>
              </div>

              <button 
                onClick={closeEmployerModal} 
                aria-label="Close employer info" 
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#6c757d", padding: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Company Logo Preview - FROM USERFILES */}
              {selectedEmployer.userFiles?.photoBase64 && (
                <div className="employer-logo-section">
                  <div className="logo-preview">
                    <img src={selectedEmployer.userFiles.photoBase64} alt="Company Logo" />
                  </div>
                  <div className="logo-info">
                    <div className="logo-name">Company Logo</div>
                    <div className="logo-actions">
                      <button 
                        className="btn-view-logo"
                        onClick={() => {
                          const modal = document.createElement('div');
                          modal.className = 'logo-modal-overlay';
                          modal.innerHTML = `
                            <div class="logo-modal" style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 24px 80px rgba(2,6,23,0.4);overflow:hidden;">
                              <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #eef4fb;">
                                <h2 style="margin:0;font-size:16px;font-weight:800;color:#12263b;">Company Logo</h2>
                                <button style="background:none;border:none;font-size:24px;cursor:pointer;color:#6c757d;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;" onclick="this.closest('.logo-modal-overlay').remove()">✕</button>
                              </div>
                              <div style="padding:24px;display:flex;align-items:center;justify-content:center;max-height:70vh;overflow-y:auto;">
                                <img src="${selectedEmployer.userFiles.photoBase64}" style="max-width:100%;max-height:100%;border-radius:10px;object-fit:contain;" alt="Logo" />
                              </div>
                            </div>
                          `;
                          document.body.appendChild(modal);
                          modal.onclick = (e) => {
                            if (e.target === modal) modal.remove();
                          };
                        }}
                      >
                        👁️ View
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Document - FROM USERFILES */}
              {selectedEmployer.userFiles?.documentBase64 && (
                <div className="employer-logo-section" style={{ background: "#fff5f0", borderColor: "#ffe6d5" }}>
                  <div style={{ fontSize: 32 }}>📄</div>
                  <div className="logo-info">
                    <div className="logo-name">Business Document</div>
                    <div className="logo-name" style={{ fontSize: 12, color: "#6c757d", fontWeight: 400, marginTop: 2 }}>
                      {selectedEmployer.userFiles.documentName || "document.pdf"}
                    </div>
                    <div className="logo-actions">
                      <button 
                        className="btn-view-logo"
                        onClick={() => {
                          const modal = document.createElement('div');
                          modal.className = 'logo-modal-overlay';
                          const isPDF = selectedEmployer.userFiles.documentName?.endsWith('.pdf');
                          modal.innerHTML = `
                            <div class="logo-modal" style="max-width:600px;width:100%;background:#fff;border-radius:12px;box-shadow:0 24px 80px rgba(2,6,23,0.4);overflow:hidden;">
                              <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #eef4fb;">
                                <h2 style="margin:0;font-size:16px;font-weight:800;color:#12263b;">Business Document</h2>
                                <button style="background:none;border:none;font-size:24px;cursor:pointer;color:#6c757d;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;" onclick="this.closest('.logo-modal-overlay').remove()">✕</button>
                              </div>
                              <div style="padding:24px;display:flex;align-items:center;justify-content:center;max-height:70vh;overflow-y:auto;">
                                ${isPDF ? `<iframe src="${selectedEmployer.userFiles.documentBase64}" style="width:100%;height:500px;border-radius:10px;border:1px solid #e9ecef;" title="Business Document"></iframe>` : `<img src="${selectedEmployer.userFiles.documentBase64}" style="max-width:100%;max-height:100%;border-radius:10px;object-fit:contain;" alt="Document" />`}
                              </div>
                            </div>
                          `;
                          document.body.appendChild(modal);
                          modal.onclick = (e) => {
                            if (e.target === modal) modal.remove();
                          };
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Employer Info Grid - ALL FIELDS FROM USERS COLLECTION */}
              <div className="employer-info-grid">
                <div className="employer-info-field">
                  <div className="employer-info-label">Email</div>
                  <div className="employer-info-value">{selectedEmployer.email || "N/A"}</div>
                </div>

                <div className="employer-info-field">
                  <div className="employer-info-label">Company Name</div>
                  <div className="employer-info-value">{selectedEmployer.companyName || "N/A"}</div>
                </div>

                <div className="employer-info-field">
                  <div className="employer-info-label">Owner/Full Name</div>
                  <div className="employer-info-value">{selectedEmployer.fullName || "N/A"}</div>
                </div>

                <div className="employer-info-field">
                  <div className="employer-info-label">Contact Person</div>
                  <div className="employer-info-value">{selectedEmployer.contactPerson || "N/A"}</div>
                </div>

                <div className="employer-info-field">
                  <div className="employer-info-label">Phone Number</div>
                  <div className="employer-info-value">{selectedEmployer.contactNumber || "N/A"}</div>
                </div>

                <div className="employer-info-field">
                  <div className="employer-info-label">Barangay</div>
                  <div className="employer-info-value">{selectedEmployer.barangay || "N/A"}</div>
                </div>

                <div className="employer-info-field employer-info-full">
                  <div className="employer-info-label">Company Address</div>
                  <div className="employer-info-value">{selectedEmployer.address || "N/A"}</div>
                </div>

                <div className="employer-info-field employer-info-full">
                  <div className="employer-info-label">Position Hiring For</div>
                  <div className="employer-info-value">{selectedEmployer.positionHiringFor || "N/A"}</div>
                </div>

                <div className="employer-info-field employer-info-full">
                  <div className="employer-info-label">Company Job Description</div>
                  <div className="employer-info-value" style={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {selectedEmployer.jobDescription || "No job description provided."}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {/* <button className="btn btn-ghost" onClick={closeEmployerModal}>Close</button> */}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && rejectingJobId && (
        <div className="rejection-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowRejectionModal(false);
        }}>
          <div className="rejection-modal">
            <div className="rejection-modal-header">
              <h3 className="rejection-modal-title">Reject Job Post</h3>
              <button 
                onClick={() => setShowRejectionModal(false)} 
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#c82333", padding: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div className="rejection-modal-body">
              <div style={{ fontSize: 13, color: "#6c757d", lineHeight: 1.5 }}>
                Please provide a reason for rejecting this job post. The employer will receive this feedback.
              </div>

              <div>
                <label className="rejection-reason-label">Rejection Reason *</label>
                <textarea
                  className="rejection-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Job description violates policy, Missing required information, Content not appropriate, etc."
                  maxLength={500}
                />
                <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6, textAlign: "right" }}>
                  {rejectionReason.length}/500
                </div>
              </div>
            </div>

            <div className="rejection-modal-footer">
              <button 
                className="btn-cancel-rejection" 
                onClick={() => setShowRejectionModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm-reject"
                onClick={() => handleRejectJob(rejectingJobId)}
                disabled={actionLoading === rejectingJobId || !rejectionReason.trim()}
              >
                {actionLoading === rejectingJobId ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
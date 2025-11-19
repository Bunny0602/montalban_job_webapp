// src/components/employer/PostJobManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

const PostJobManager = () => {
  const user = auth.currentUser;
  const [jobs, setJobs] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    contactNumber: "",
    address: "",
    barangay: "",
    experience: "",
    skills: "",
    jobImage: "",
    applicantLimit: "",
    jobStatus: "open",
    jobType: "full-time",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [employerInfo, setEmployerInfo] = useState({
    contactNumber: "",
    address: "",
    barangay: "",
  });

  const [appCounts, setAppCounts] = useState({});
  const listenersRef = useRef({});

  const barangays = [
    "Balite",
    "Burgos",
    "Geronimo",
    "Macabud",
    "Manggahan",
    "Mascap",
    "Puray",
    "Rosario",
    "San Isidro",
    "San Jose",
    "San Rafael",
  ];

  const jobTypes = ["Full-time", "Part-time"];

  // Fetch jobs in real-time
  useEffect(() => {
    if (!user) return;
    setIsLoadingJobs(true);
    const q = query(collection(db, "jobs"), where("employerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setJobs(jobsList);
        setIsLoadingJobs(false);
      },
      (error) => {
        console.error("Error fetching jobs:", error);
        setIsLoadingJobs(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [user]);

  // When jobs change, (re)create application listeners per job to track applicant count
  useEffect(() => {
    // cleanup existing listeners
    Object.values(listenersRef.current).forEach((unsub) => unsub && unsub());
    listenersRef.current = {};
    setAppCounts({});

    // create listeners for each job to count applications
    jobs.forEach((job) => {
      const q = query(collection(db, "applications"), where("jobId", "==", job.id));
      const unsub = onSnapshot(q, (snap) => {
        // EXCLUDE rejected applications from count
        const validApps = snap.docs
          .map(doc => doc.data())
          .filter(app => app.status !== "rejected");
        
        const count = validApps.length;
        setAppCounts((prev) => ({ ...prev, [job.id]: count }));

        // auto-close if limit set and reached/exceeded
        const limit = Number(job.applicantLimit) || 0;
        const status = job.jobStatus || "open";
        if (limit > 0 && count >= limit && status !== "closed") {
          updateDoc(doc(db, "jobs", job.id), { jobStatus: "closed" }).catch((err) =>
            console.error("Auto-close update failed", err)
          );
        }
      });
      listenersRef.current[job.id] = unsub;
    });

    return () => {
      Object.values(listenersRef.current).forEach((unsub) => unsub && unsub());
      listenersRef.current = {};
    };
  }, [jobs]);

  // Fetch employer info on component mount
  useEffect(() => {
    const fetchEmployerInfo = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setEmployerInfo({
            contactNumber: userData.contactNumber || "",
            address: userData.address || "",
            barangay: userData.barangay || "",
          });
          // Set form data with employer defaults
          setFormData((prev) => ({
            ...prev,
            contactNumber: userData.contactNumber || "",
            address: userData.address || "",
            barangay: userData.barangay || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching employer info:", err);
      }
    };

    fetchEmployerInfo();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, jobImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      jobTitle: "",
      jobDescription: "",
      contactNumber: employerInfo.contactNumber,
      address: employerInfo.address,
      barangay: employerInfo.barangay,
      experience: "",
      skills: "",
      jobImage: "",
      applicantLimit: "",
      jobStatus: "open",
      jobType: "full-time",
    });
    setEditingJobId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    if (
      !formData.jobTitle ||
      !formData.jobDescription ||
      !formData.contactNumber ||
      !formData.address ||
      !formData.barangay
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const applicantLimit = formData.applicantLimit === "" ? 0 : Number(formData.applicantLimit);
    if (applicantLimit < 0) {
      setError("Applicant limit must be zero or greater.");
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user profile to get company details
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      // Fetch userFiles to get documentName
      const filesDocRef = doc(db, "userFiles", user.uid);
      const filesSnap = await getDoc(filesDocRef);
      const filesData = filesSnap.exists() ? filesSnap.data() : {};
      
      const companyName = userData.companyName || userData.fullName || "Unknown Company";
      const contactPerson = userData.contactPerson || "";
      const positionHiringFor = userData.positionHiringFor || "";
      const jobDescriptionProfile = userData.jobDescription || "";
      const documentName = filesData.documentName || "";

      const payload = {
        ...formData,
        applicantLimit: applicantLimit,
        jobStatus: formData.jobStatus || "open",
        jobType: formData.jobType || "full-time",
        companyName: companyName,
        // Hide employer info - save it but don't display
        _contactPerson: contactPerson,
        _positionHiringFor: positionHiringFor,
        _jobDescriptionProfile: jobDescriptionProfile,
        _documentName: documentName,
        // ADD: New status field to track admin approval
        approvalStatus: "pending", // pending, approved, rejected
      };

      if (editingJobId) {
        // When updating, don't reset the approvalStatus unless it's a new submission
        const existingJob = jobs.find(j => j.id === editingJobId);
        await updateDoc(doc(db, "jobs", editingJobId), {
          ...payload,
          approvalStatus: existingJob?.approvalStatus || "pending",
        });
        setSuccess("Job updated successfully!");
      } else {
        await addDoc(collection(db, "jobs"), {
          ...payload,
          employerId: user.uid,
          createdAt: new Date(),
          approvalStatus: "pending", // New jobs start as pending
        });
        setSuccess("Job posted successfully! It's pending admin approval.");
      }
      resetForm();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setFormData({
      jobTitle: job.jobTitle,
      jobDescription: job.jobDescription,
      contactNumber: job.contactNumber,
      address: job.address,
      barangay: job.barangay,
      experience: job.experience || "",
      skills: job.skills || "",
      jobImage: job.jobImage || "",
      applicantLimit: job.applicantLimit ? String(job.applicantLimit) : "",
      jobStatus: job.jobStatus || "open",
      jobType: job.jobType || "full-time",
    });
    setEditingJobId(job.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, "jobs", id));
        setSuccess("Job deleted successfully!");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        jobStatus: currentStatus === "open" ? "closed" : "open",
      });
    } catch (err) {
      console.error("Failed to toggle job status", err);
      setError("Failed to update job status.");
    }
  };

  // Helper function to get approval status badge
  const getApprovalBadge = (approvalStatus) => {
    switch (approvalStatus) {
      case "approved":
        return {
          label: "Approved",
          bg: "#d4edda",
          color: "#155724",
          border: "#c3e6cb"
        };
      case "rejected":
        return {
          label: "Rejected",
          bg: "#fff5f6",
          color: "#c82333",
          border: "#fde7ea"
        };
      default:
        return {
          label: "Pending Approval",
          bg: "#fff3cd",
          color: "#856404",
          border: "#ffeeba"
        };
    }
  };

  return (
    <div className="postjob-root">
      <style>{`
        .postjob-root { max-width:1200px; margin:18px auto; padding:18px; }
        .header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
        .page-title { font-size:22px; font-weight:800; color:#12263b; margin:0; }
        .btn-post {
          padding:11px 18px; border-radius:10px; border:none;
          background: linear-gradient(135deg,#0d6efd,#0a58ca);
          color:#fff; font-weight:700; cursor:pointer;
          box-shadow: 0 8px 26px rgba(13,110,253,0.12);
          transition: transform .12s, box-shadow .12s;
        }
        .btn-post:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(13,110,253,0.16); }
        .btn-post:active { transform: translateY(0); }

        /* Loading States */
        .loading-overlay {
          display:flex; align-items:center; justify-content:center;
          min-height:400px; color:#6c757d;
        }
        .spinner {
          width:48px; height:48px; border:4px solid #f0f4f9;
          border-top-color:#0d6efd; border-radius:50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-container {
          display:flex; flex-direction:column; align-items:center; gap:12px;
        }
        .loader-text { font-size:14px; font-weight:600; color:#6c757d; }

        /* Skeleton Loader for Cards */
        .skeleton-grid {
          display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
          gap:18px; margin-top:12px;
        }
        .skeleton-card {
          background:#fff; border-radius:14px; border:1px solid #f0f4f9;
          box-shadow: 0 10px 30px rgba(16,24,40,0.04); overflow:hidden;
          display:flex; flex-direction:column;
        }
        .skeleton-image {
          width:100%; height:160px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size:200% 100%;
          animation: shimmer 2s infinite;
          border-bottom:1px solid #f0f4f9;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skeleton-content { padding:16px; display:flex; flex-direction:column; gap:12px; }
        .skeleton-title {
          height:20px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size:200% 100%;
          animation: shimmer 2s infinite;
          border-radius:6px;
          width:70%;
        }
        .skeleton-text {
          height:14px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size:200% 100%;
          animation: shimmer 2s infinite;
          border-radius:6px;
        }
        .skeleton-text.short { width:50%; }
        .skeleton-buttons {
          display:flex; gap:8px; margin-top:auto;
        }
        .skeleton-btn {
          flex:1; height:36px; background:linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size:200% 100%;
          animation: shimmer 2s infinite;
          border-radius:8px;
        }

        /* Modal */
        .modal-overlay {
          position:fixed; inset:0; background:rgba(16,24,40,0.55);
          display:flex; align-items:center; justify-content:center;
          z-index:50; backdrop-filter:blur(8px); padding:18px;
          animation: fadeIn .20s ease;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-content {
          background:#fff; border-radius:18px; box-shadow: 0 28px 72px rgba(16,24,40,0.16);
          width:100%; max-width:520px; max-height:92vh; overflow-y:auto;
          animation: slideUp .24s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideUp { from { transform: translateY(48px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .modal-header {
          padding:24px; border-bottom:2px solid #f0f4f9; display:flex;
          align-items:center; justify-content:space-between; 
          background: linear-gradient(135deg,#f9fbff 0%,#fbfdff 100%);
        }
        .modal-title { font-size:19px; font-weight:800; color:#12263b; margin:0; }
        .modal-close {
          background:transparent; border:none; cursor:pointer; color:#6c757d;
          font-size:28px; padding:0; width:40px; height:40px; display:flex;
          align-items:center; justify-content:center; border-radius:10px;
          transition: background .14s, color .14s, transform .12s;
        }
        .modal-close:hover { background:#f0f4f9; color:#0d6efd; transform: rotate(90deg); }
        .modal-body { padding:24px; display:flex; flex-direction:column; gap:18px; }
        .form-group { display:flex; flex-direction:column; gap:8px; }
        .form-label { font-size:13px; color:#344; font-weight:700; text-transform: uppercase; letter-spacing:0.3px; }
        .form-input, .form-select, .form-textarea {
          width:100%; padding:13px 14px; border-radius:12px; border:1.5px solid #e9eef6;
          background:#fff; font-size:14px; outline:none;
          transition: box-shadow .14s, border-color .14s, background .12s;
        }
        .form-input::placeholder, .form-textarea::placeholder { color:#adb5bd; }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          box-shadow: 0 12px 32px rgba(13,110,253,0.12); 
          border-color:#0d6efd;
          background:#fbfdff;
        }
        .form-textarea { min-height:120px; resize:vertical; font-family: inherit; }

        /* Image upload section */
        .image-upload-wrapper { display:flex; flex-direction:column; gap:12px; }
        .image-preview {
          width:100%; height:160px; border-radius:14px; background:#f8fbff;
          border:2.5px dashed #0d6efd; display:flex; align-items:center;
          justify-content:center; overflow:hidden; position:relative;
          transition: all .14s ease;
        }
        .image-preview:hover { background: linear-gradient(135deg,#f0f7ff,#f8fbff); border-color: #0a58ca; }
        .image-preview img { width:100%; height:100%; object-fit:cover; transition: transform .20s ease; }
        .image-preview:hover img { transform: scale(1.04); }
        .image-preview.empty {
          color:#0d6efd; font-size:44px; font-weight:700;
        }
        .upload-btn {
          padding:11px 16px; border-radius:11px; border:1.5px solid #0d6efd;
          background:#fbfdff; color:#0d6efd; font-weight:700; cursor:pointer;
          font-size:13px; transition: all .14s ease;
        }
        .upload-btn:hover { background:#e9f4ff; border-color: #0a58ca; transform: translateY(-2px); }
        .upload-input { display:none; }

        .modal-footer {
          padding:18px 24px; border-top:2px solid #f0f4f9;
          display:flex; gap:12px; justify-content:flex-end; background:#fbfdff;
        }
        .btn { padding:11px 20px; border-radius:10px; border:none; font-weight:700; cursor:pointer; transition: all .12s; font-size:14px; }
        .btn-primary { background: linear-gradient(135deg,#0d6efd,#0a58ca); color:#fff; box-shadow: 0 8px 24px rgba(13,110,253,0.14); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(13,110,253,0.18); }
        .btn-secondary { background:#f0f4f9; color:#0d6efd; border:1.5px solid #e6f0ff; font-weight:700; }
        .btn-secondary:hover { background:#e9f4ff; }
        .btn:disabled { opacity:0.6; cursor:not-allowed; transform: none !important; }
        .alert { padding:13px 15px; border-radius:11px; font-size:13px; font-weight:600; border-left:4px solid; }
        .alert-error { background:#fff0f1; color:#c82333; border-color:#ff6b7a; }
        .alert-success { background:#f0faf7; color:#0b6b3a; border-color:#52d273; }

        /* Jobs Grid */
        .jobs-grid {
          display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
          gap:18px; margin-top:12px;
        }
        .job-card {
          position: relative;
          background:#fff; border-radius:14px; border:1px solid #f0f4f9;
          box-shadow: 0 10px 30px rgba(16,24,40,0.04); overflow:hidden;
          display:flex; flex-direction:column;
          transition: box-shadow .12s;
        }
        .job-card:hover {
          box-shadow: 0 20px 44px rgba(16,24,40,0.10);
        }
        .job-image {
          width:100%; height:160px; background:linear-gradient(135deg,#e9f4ff,#f7fbff);
          display:flex; align-items:center; justify-content:center; overflow:hidden;
          border-bottom:1px solid #f0f4f9;
          position: relative;
        }
        .job-image img { width:100%; height:100%; object-fit:cover; }
        .job-image.empty {
          color:#0d6efd; font-size:40px;
        }
        .job-content { padding:16px; display:flex; flex-direction:column; gap:12px; flex:1; }
        .job-title { font-size:16px; font-weight:800; color:#12263b; margin:0; }
        .job-meta { display:flex; gap:8px; flex-wrap:wrap; }
        .meta-chip {
          background:#fbfdff; border:1px solid #e6f0ff; color:#235;
          padding:6px 10px; border-radius:999px; font-size:12px; font-weight:600;
          cursor:default;
        }
        .job-desc { font-size:13px; color:#44566a; line-height:1.45; margin:0; }
        
        /* Info section with hover effects */
        .job-info-section {
          display:flex; flex-direction:column; gap:8px; padding:10px;
          background:#f9fbff; border-radius:10px; margin-top:4px;
        }
        .info-row {
          display:flex; gap:8px; padding:6px 0; font-size:13px; color:#44566a;
          border-radius:6px; padding:8px 10px;
          transition: all .14s ease;
        }
        .info-row:hover {
          background:#f0f4f9; color:#0d6efd; padding-left:14px;
        }
        .info-label { font-weight:700; color:#235; min-width:75px; }
        .info-value { flex:1; word-break:break-word; }
        
        .job-footer { display:flex; gap:8px; margin-top:auto; flex-wrap: wrap; }
        .btn-sm { padding:9px 12px; font-size:13px; border-radius:8px; border:none; cursor:pointer; font-weight:700; transition: all .12s; }
        .btn-edit { background:#e9f4ff; color:#0d6efd; }
        .btn-delete { background:#fff5f6; color:#c82333; }
        .btn-sm:hover { transform: translateY(-2px); }

        /* Approval Status Badge */
        .approval-badge {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid;
          display: inline-block;
          margin-top: 4px;
        }

        /* Public Indicator */
        .public-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          color: #155724;
          font-size: 12px;
          font-weight: 700;
          margin-top: 4px;
        }

        .empty-state {
          text-align:center; padding:60px 20px; color:#6c757d;
        }
        .empty-icon { font-size:56px; margin-bottom:14px; }
        .empty-text { font-size:14px; margin:0; }

        @media (max-width:600px) {
          .modal-content { max-width:100%; }
          .jobs-grid { grid-template-columns:1fr; }
          .skeleton-grid { grid-template-columns:1fr; }
          .modal-header { padding:20px; }
          .modal-body { padding:20px; gap:16px; }
          .modal-footer { padding:16px 20px; }
          .job-footer { flex-direction: column; }
        }
      `}</style>

      <div className="header">
        <h2 className="page-title">Job Postings</h2>
        <p></p>
        <button
          className="btn-post"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Post New Job
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingJobId ? "Edit Job Posting" : "Create New Job"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="image-upload-wrapper">
                <label className="form-label">Job Image</label>
                <div className={`image-preview ${!formData.jobImage ? "empty" : ""}`}>
                  {formData.jobImage ? <img src={formData.jobImage} alt="Job preview" /> : <span>📷</span>}
                </div>
                <input id="image-upload" className="upload-input" type="file" accept="image/*" onChange={handleImageChange} />
                <button className="upload-btn" onClick={() => document.getElementById("image-upload").click()} type="button">
                  + Upload Image
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  className="form-input"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g., Senior Software Developer"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-textarea"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="Describe the job responsibilities, requirements, and benefits..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-select" name="jobType" value={formData.jobType} onChange={handleChange}>
                  {jobTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <input
                  className="form-input"
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g., React, Node.js, MongoDB (comma-separated)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input className="form-input" type="text" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g., 2-5 years" />
              </div>

              <div className="form-group">
                <label className="form-label">Barangay *</label>
                <select className="form-select" name="barangay" value={formData.barangay} onChange={handleChange}>
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Address *</label>
                <input className="form-input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input className="form-input" type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Your contact number" />
              </div>

              <div className="form-group">
                <label className="form-label">Applicant Limit (0 = unlimited)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  name="applicantLimit"
                  value={formData.applicantLimit}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Status</label>
                <select className="form-select" name="jobStatus" value={formData.jobStatus} onChange={handleChange}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Processing..." : editingJobId ? "Update Job" : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingJobs ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
                <div style={{ marginTop: 8 }}>
                  <div className="skeleton-text" style={{ marginBottom: 8 }}></div>
                  <div className="skeleton-text" style={{ marginBottom: 8 }}></div>
                  <div className="skeleton-text short"></div>
                </div>
                <div className="skeleton-buttons">
                  <div className="skeleton-btn"></div>
                  <div className="skeleton-btn"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <p className="empty-text">No jobs posted yet. Click "Post New Job" to get started.</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => {
            const count = appCounts[job.id] || 0;
            const isClosed = (job.jobStatus || "open") === "closed";
            const isApproved = job.approvalStatus === "approved";
            const isRejected = job.approvalStatus === "rejected";
            const isPending = !isApproved && !isRejected;
            const approvalBadge = getApprovalBadge(job.approvalStatus);

            return (
              <div key={job.id} className="job-card" aria-hidden={isClosed}>
                <div className={`job-image ${!job.jobImage ? "empty" : ""}`}>
                  {job.jobImage ? <img src={job.jobImage} alt={job.jobTitle} /> : <span>💼</span>}
                  {isClosed && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "#fff5f6",
                      color: "#c82333",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      border: "1px solid #fde7ea"
                    }}>
                      CLOSED
                    </div>
                  )}
                </div>

                <div className="job-content">
                  <h4 className="job-title">{job.jobTitle}</h4>

                  <div className="job-meta">
                    <span className="meta-chip">
                      {job.jobType === "part-time" ? "Part-time" : "Full-time"}
                    </span>
                  </div>

                  <div className="job-desc">{job.jobDescription?.substring(0, 100)}...</div>

                  <div className="job-info-section">
                    <div className="info-row">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{job.barangay}, {job.address}</span>
                    </div>

                    {job.experience && (
                      <div className="info-row">
                        <span className="info-label">Experience:</span>
                        <span className="info-value">{job.experience}</span>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="info-label">Call:</span>
                      <span className="info-value">{job.contactNumber}</span>
                    </div>
                  </div>

                  {job.skills && (
                    <div style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                      <strong>Skills:</strong> {job.skills?.substring(0, 50)}...
                    </div>
                  )}

                  {/* ADD: Approval Status Badge */}
                  <div
                    className="approval-badge"
                    style={{
                      background: approvalBadge.bg,
                      color: approvalBadge.color,
                      borderColor: approvalBadge.border
                    }}
                    title={
                      isApproved
                        ? "This job is public and visible to job seekers"
                        : isPending
                        ? "Waiting for admin approval before job becomes public"
                        : "Your job was rejected by admin. Please edit and resubmit."
                    }
                  >
                    {approvalBadge.label}
                  </div>

                  {/* ADD: Public Indicator (only show if approved) */}
                  {isApproved && (
                    <div className="public-indicator">
                      Public & Accepting Applicants
                    </div>
                  )}

                  <div className="job-footer" style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn-sm btn-edit" onClick={() => handleEdit(job)} disabled={loading}>
                        Edit
                      </button>

                      <button className="btn-sm btn-delete" onClick={() => handleDelete(job.id)} disabled={loading}>
                        Delete
                      </button>
                    </div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {isApproved && (
                        <div className="meta-chip" title="Number of applicants">
                          Applicants: {count}
                          {job.applicantLimit ? ` / ${job.applicantLimit}` : ""}
                        </div>
                      )}

                      {isApproved && (
                        <button
                          className="btn-sm"
                          style={{
                            background: isClosed ? "#e9f4ff" : "#fff5f6",
                            color: isClosed ? "#0d6efd" : "#c82333",
                            borderRadius: 8,
                            padding: "8px 10px",
                            fontWeight: 800,
                          }}
                          onClick={() => toggleJobStatus(job.id, job.jobStatus)}
                        >
                          {isClosed ? "Reopen" : "Close"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostJobManager;

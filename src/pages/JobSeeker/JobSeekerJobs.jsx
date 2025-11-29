// src/components/jobseeker/JobSeekerJobs.jsx
import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, serverTimestamp, doc, getDoc, query, where } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";

const JobSeekerJobs = () => {
  const user = auth.currentUser;
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedSkills, setSelectedSkills] = useState("");
  const [barangays, setBarangays] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  // ===== FETCH ONLY APPROVED JOBS =====
  useEffect(() => {
    if (!user) return;

    setIsLoadingJobs(true);
    // Query for jobs APPROVED by admin AND that are OPEN for applications
    const q = query(
      collection(db, "jobs"), 
      where("approvalStatus", "==", "approved") 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(jobList);

      // Extract unique barangays
      const uniqueBarangays = [...new Set(jobList.map(j => j.barangay).filter(Boolean))];
      setBarangays(uniqueBarangays.sort());

      // Extract unique skills
      const skillsSet = new Set();
      jobList.forEach(job => {
        if (job.skills) {
          job.skills.split(",").forEach(skill => {
            skillsSet.add(skill.trim());
          });
        }
      });
      setAllSkills(Array.from(skillsSet).sort());

      setIsLoadingJobs(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setIsLoadingJobs(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ===== FETCH APPLICATIONS WITH STATUS =====
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "applications");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appliedJobsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.seekerId === user.uid);
      setApplications(appliedJobsData);
    });

    return () => unsubscribe();
  }, [user]);

  // ===== FILTER JOBS BASED ON SEARCH AND FILTERS =====
  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      (job.jobTitle || "").toLowerCase().includes(q) ||
      (job.jobDescription || "").toLowerCase().includes(q)
    );

    const matchesBarangay = !selectedBarangay || job.barangay === selectedBarangay;

    const matchesSkills = !selectedSkills ||
      ((job.skills || "").toLowerCase().split(",").map(s => s.trim()).includes(selectedSkills.toLowerCase()));

    return matchesSearch && matchesBarangay && matchesSkills;
  });

  const openModal = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedJob(null);
    setShowModal(false);
  };

  const handleApply = async (job) => {
    if (!user) {
      setMessage("Please login to apply.");
      return;
    }

    if (!job) return;

    if ((job.jobStatus || "approved") === "closed") {
      setMessage("This job is closed and cannot accept applications.");
      return;
    }

    // Check ONLY the latest application status
    // Allow reapply only if latest is rejected or no application exists
    const allAppsForJob = applications
      .filter(app => app.jobId === job.id)
      .sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));

    const latestApp = allAppsForJob[0];

    // Block only if latest application is pending, scheduled, or accepted
    if (latestApp && ["pending", "scheduled", "accepted"].includes(latestApp.status)) {
      setMessage("You already applied for this job.");
      return;
    }

    // Allow if: no application exists OR latest application is rejected
    try {
      setIsApplying(true);

      // Fetch seeker profile
      let seekerData = null;
      try {
        const seekerDocRef = doc(db, "seekers", user.uid);
        const seekerSnap = await getDoc(seekerDocRef);
        if (seekerSnap.exists()) {
          seekerData = seekerSnap.data();
        } else {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const u = userSnap.data();
            seekerData = (u && typeof u === "object" && u.profile && typeof u.profile === "object") ? u.profile : u;
          }
        }
      } catch (readErr) {
        console.warn("Unable to load seeker profile:", readErr);
      }

      // Fetch user files
      let userFiles = null;
      try {
        const filesDocRef = doc(db, "userFiles", user.uid);
        const filesSnap = await getDoc(filesDocRef);
        if (filesSnap.exists()) {
          userFiles = filesSnap.data();
        }
      } catch (filesErr) {
        console.warn("Unable to load user files:", filesErr);
      }

      // Fetch job full details
      let jobFullData = job;
      try {
        const jobDocRef = doc(db, "jobs", job.id);
        const jobSnap = await getDoc(jobDocRef);
        if (jobSnap.exists()) {
          jobFullData = { id: job.id, ...jobSnap.data() };
        }
      } catch (jobErr) {
        console.warn("Unable to load full job details:", jobErr);
      }

      // Build comprehensive application payload
      const applicationPayload = {
        jobId: job.id,
        seekerId: user.uid,
        fullName:
          seekerData?.fullName ||
          seekerData?.name ||
          `${(seekerData?.firstName || "").trim()} ${(seekerData?.lastName || "").trim()}`.trim() ||
          user.displayName ||
          "",
        email: seekerData?.email || user.email || "",
        contactNumber:
          seekerData?.contactNumber || seekerData?.phone || seekerData?.contact || "",
        age: seekerData?.age || "",
        gender: seekerData?.gender || "",
        address: seekerData?.address || "",
        barangay: seekerData?.barangay || "",
        desiredJob: seekerData?.desiredJob || "",
        experience: seekerData?.experience || "",
        education: seekerData?.education || "",
        skills: seekerData?.skills || "",
        profileImage: userFiles?.photoBase64 || "",
        profileImageName: userFiles?.photoName || "",
        resumeLink: userFiles?.resumeBase64 || "",
        resumeName: userFiles?.resumeName || "",
        coverLetter: seekerData?.coverLetter || "",
        raw: {
          fullProfile: seekerData || {},
          desiredJob: seekerData?.desiredJob || "",
          skills: seekerData?.skills || "",
          coverLetter: seekerData?.coverLetter || "",
          age: seekerData?.age || "",
          gender: seekerData?.gender || "",
          education: seekerData?.education || "",
        },
        appliedAt: serverTimestamp(),
        status: "pending",
        positionApplied: jobFullData?.jobTitle || jobFullData?.title || "Unknown Position",
        employerId: jobFullData?.employerId || jobFullData?.employer || "",
        companyName: jobFullData?.companyName || jobFullData?.company || "Unknown Company",
        companyAddress: jobFullData?.companyAddress || jobFullData?.address || "",
        companyBarangay: jobFullData?.companyBarangay || jobFullData?.barangay || "",
        jobTitle: jobFullData?.jobTitle || "",
        jobDescription: jobFullData?.jobDescription || "",
        jobImage: jobFullData?.jobImage || "",
        jobExperience: jobFullData?.experience || "",
        jobSkills: jobFullData?.skills || "",
        jobContactNumber: jobFullData?.contactNumber || "",
        applicantLimit: jobFullData?.applicantLimit || 0,
        jobStatus: jobFullData?.jobStatus || "approved",
        jobType: jobFullData?.jobType || "full-time",
      };

      const docRef = await addDoc(collection(db, "applications"), applicationPayload);

      console.debug("Application saved successfully:", docRef.id);
      setMessage("✅ Applied successfully! Your application has been sent to the employer.");
      
      // Close modal after successful application
      setTimeout(() => {
        closeModal();
      }, 500);
      
      // Clear message after delay
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Application error:", err);
      setMessage("❌ Error applying: " + (err.message || "unknown error occurred"));
    } finally {
      setIsApplying(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBarangay("");
    setSelectedSkills("");
  };

  const hasActiveFilters = searchQuery || selectedBarangay || selectedSkills;

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

  return (
    <div className="jobseeker-jobs-root">
      <style>{`
        .jobseeker-jobs-root {
          max-width: 1200px;
          margin: 18px auto;
          padding: 18px;
        }

        .jobs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .jobs-title {
          font-size: 22px;
          font-weight: 800;
          color: #12263b;
          margin: 0;
        }

        .jobs-count {
          font-size: 13px;
          color: #6c757d;
          font-weight: 600;
        }

        /* Search & Filter Section */
        .search-filter-section {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #f0f4f9;
          padding: 18px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.04);
        }

        .search-container {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 38px;
          border-radius: 10px;
          border: 1.5px solid #e9eef6;
          font-size: 14px;
          outline: none;
          transition: box-shadow 0.14s ease, border-color 0.14s ease;
        }

        .search-input::placeholder {
          color: #adb5bd;
        }

        .search-input:focus {
          box-shadow: 0 10px 28px rgba(13, 110, 253, 0.10);
          border-color: #0d6efd;
          background: #fbfdff;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #6c757d;
          pointer-events: none;
        }

        .filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 12px;
          color: #344;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .filter-select {
          padding: 11px 12px;
          border-radius: 10px;
          border: 1.5px solid #e9eef6;
          background: #fff;
          font-size: 14px;
          color: #12263b;
          cursor: pointer;
          outline: none;
          transition: box-shadow 0.14s ease, border-color 0.14s ease;
        }

        .filter-select:focus {
          box-shadow: 0 10px 28px rgba(13, 110, 253, 0.10);
          border-color: #0d6efd;
          background: #fbfdff;
        }

        .filter-select option {
          color: #12263b;
          background: #fff;
        }

        .btn-clear {
          padding: 10px 16px;
          border-radius: 10px;
          border: 1.5px solid #e9eef6;
          background: #f8fbff;
          color: #0d6efd;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .btn-clear:hover {
          background: #e9f4ff;
          border-color: #0d6efd;
          transform: translateY(-2px);
        }

        .btn-clear:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .filter-status {
          font-size: 12px;
          color: #6c757d;
          padding: 6px 10px;
          background: #f0f4f9;
          border-radius: 6px;
          margin-top: 10px;
        }

        .filter-status.active {
          color: #0d6efd;
          background: #e9f4ff;
          font-weight: 600;
        }

        /* Message Alert */
        .message-alert {
          padding: 13px 16px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          border-left: 4px solid #52d273;
          background: #f0faf7;
          color: #0b6b3a;
          animation: slideDown 0.20s ease;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Loading Skeleton */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
          margin-top: 12px;
        }

        .skeleton-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #f0f4f9;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .skeleton-image {
          width: 100%;
          height: 160px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-bottom: 1px solid #f0f4f9;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .skeleton-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-title {
          height: 20px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
          width: 70%;
        }

        .skeleton-text {
          height: 14px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
        }

        .skeleton-text.short {
          width: 50%;
        }

        .skeleton-btn {
          height: 40px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 10px;
          margin-top: auto;
        }

        /* Jobs Grid */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
          margin-top: 12px;
        }

        .job-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #f0f4f9;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.12s ease;
          position: relative;
        }

        .job-card:hover {
          box-shadow: 0 20px 44px rgba(16, 24, 40, 0.10);
        }

        .job-image {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #e9f4ff, #f7fbff);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-bottom: 1px solid #f0f4f9;
        }

        .job-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .job-image.empty {
          color: #0d6efd;
          font-size: 40px;
        }

        .job-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .job-title {
          font-size: 16px;
          font-weight: 800;
          color: #12263b;
          margin: 0;
        }

        .job-desc {
          font-size: 13px;
          color: #44566a;
          line-height: 1.45;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: calc(1.45em * 4);
        }

        /* Info section with hover effects */
        .job-info-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          background: #f9fbff;
          border-radius: 10px;
          margin-top: 4px;
        }

        .info-row {
          display: flex;
          gap: 8px;
          padding: 8px 10px;
          font-size: 13px;
          color: #44566a;
          border-radius: 6px;
          transition: all 0.14s ease;
        }

        .info-row:hover {
          background: #f0f4f9;
          color: #0d6efd;
          padding-left: 14px;
        }

        .info-label {
          font-weight: 700;
          color: #235;
          min-width: 65px;
        }

        .info-value {
          flex: 1;
          word-break: break-word;
        }

        .job-skills {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
        }

        .job-footer {
          display: flex;
          gap: 10px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f0f4f9;
        }

        .btn-apply {
          flex: 1;
          padding: 11px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .btn-apply.available {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
          color: #fff;
          box-shadow: 0 8px 24px rgba(13, 110, 253, 0.14);
        }

        .btn-apply.available:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.18);
        }

        .btn-apply.applied {
          background: #e9eef6;
          color: #6c757d;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 14px;
        }

        .empty-text {
          font-size: 14px;
          margin: 0;
        }

        .badge-closed {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #fff5f6;
          color: #c82333;
          padding: 6px 10px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 12px;
          border: 1px solid #fde7ea;
        }

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
        }

        .modal {
          width: 100%;
          max-width: 920px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 24px 80px rgba(2,6,23,0.4);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #f0f4f9;
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
          border-top: 1px solid #f0f4f9;
          justify-content: flex-end;
        }

        .skills-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
        .skill-pill { padding:6px 10px; background:#f3fbff; border-radius:999px; font-weight:700; color:#0b6b3a; font-size:13px; border:1px solid #e6f7ef; }

        .btn-ghost {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #eef4fb;
          background: transparent;
          color: #12263b;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .btn-ghost:hover {
          background: #fbfdff;
          border-color: #0d6efd;
        }

        @media (max-width: 900px) {
          .filter-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .modal { max-width: 100%; height: 100%; border-radius: 8px; }
        }

        @media (max-width: 600px) {
          .jobs-grid {
            grid-template-columns: 1fr;
          }
          .skeleton-grid {
            grid-template-columns: 1fr;
          }
          .search-container {
            flex-direction: column;
          }
          .search-filter-section {
            padding: 14px;
          }
          .filter-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="jobs-header">
        <h2 className="jobs-title">Available Jobs</h2>
        {!isLoadingJobs && <span className="jobs-count">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}</span>}
      </div>

      {/* Search & Filter Section */}
      <div className="search-filter-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search jobs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Barangay</label>
            <select
              className="filter-select"
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
            >
              <option value="">All Barangays</option>
              {barangays.map(barangay => (
                <option key={barangay} value={barangay}>{barangay}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Skills</label>
            <select
              className="filter-select"
              value={selectedSkills}
              onChange={(e) => setSelectedSkills(e.target.value)}
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">&nbsp;</label>
          </div>

          <button
            className="btn-clear"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            title="Clear all filters"
          >
            Clear Filters
          </button>
        </div>

        {hasActiveFilters && (
          <div className="filter-status active">
            🔍 {filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {message && <div className="message-alert">{message}</div>}

      {/* Loading / Empty / Grid */}
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
                <div className="skeleton-btn"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <p className="empty-text">{hasActiveFilters ? "No jobs match your filters. Try adjusting your search." : "No approved jobs posted yet. Check back later!"}</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => {
            const isClosed = (job.jobStatus || "approved") === "closed";
            const preview = (job.jobDescription || "").substring(0, 140);

            return (
              <div key={job.id} className="job-card" aria-disabled={isClosed}>
                <div className={`job-image ${!job.jobImage ? "empty" : ""}`}>
                  {job.jobImage ? <img src={job.jobImage} alt={job.jobTitle} /> : <span>💼</span>}
                </div>

                {isClosed && <div className="badge-closed">CLOSED</div>}

                <div className="job-content">
                  <h4 className="job-title">{job.jobTitle}</h4>

                  <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 8 }}>
                    Date: {formatDate(job.createdAt || job.postedDate)}
                  </div>

                  <div className="job-desc" title={job.jobDescription}>
                    {preview}{(job.jobDescription || "").length > 140 ? "..." : ""}
                  </div>

                  <div className="job-info-section">
                    <div className="info-row">
                      <span className="info-label">Location:</span>
                      <span className="info-value">
                        {job.barangay && job.address ? `${job.barangay}, ${job.address}` : job.barangay || job.address || "—"}
                      </span>
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
                    <div className="job-skills">
                      <strong>Skills:</strong> {job.skills?.substring(0, 50)}...
                    </div>
                  )}

                  <div className="job-skills">
                    <strong>Employment Type:</strong> {job.jobType === "part-time" ? "Part-time" : "Full-time"}
                  </div>

                  <div className="job-footer">
                    {(() => {
                      const allAppsForJob = applications
                        .filter(app => app.jobId === job.id)
                        .sort((a, b) => (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0));
                      
                      const latestApp = allAppsForJob[0];
                      const latestStatus = latestApp?.status;

                      if (latestStatus === "accepted") {
                        return (
                          <div style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "10px",
                            background: "#d4edda",
                            color: "#155724",
                            fontWeight: 700,
                            fontSize: "13px",
                            textAlign: "center",
                            border: "1px solid #c3e6cb"
                          }}>
                            Accepted
                          </div>
                        );
                      }

                      if (latestStatus === "scheduled") {
                        return (
                          <div style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "10px",
                            background: "#e2e3e5",
                            color: "#383d41",
                            fontWeight: 700,
                            fontSize: "13px",
                            textAlign: "center",
                            border: "1px solid #d6d8db"
                          }}>
                            Scheduled
                          </div>
                        );
                      }

                      // If pending - show applied status
                      if (latestStatus === "pending") {
                        return (
                          <div style={{
                            flex: 1,
                            padding: "11px 16px",
                            borderRadius: "10px",
                            background: "#e9eef6",
                            color: "#6c757d",
                            fontWeight: 700,
                            fontSize: "13px",
                            textAlign: "center",
                            border: "1px solid #dee2e6"
                          }}>
                            Applied
                          </div>
                        );
                      }

                      // If rejected OR no application - show View & Apply button
                      if (latestStatus === "rejected" || !latestApp) {
                        return (
                          <button
                            className="btn-apply available"
                            onClick={() => openModal(job)}
                            disabled={isClosed}
                            title={isClosed ? "Job is closed" : "Click to view and apply"}
                          >
                            {isClosed ? "Closed" : "View & Apply"}
                          </button>
                        );
                      }

                      // Default fallback
                      return (
                        <button
                          className="btn-apply available"
                          onClick={() => openModal(job)}
                          disabled={isClosed}
                          title={isClosed ? "Job is closed" : "Click to view and apply"}
                        >
                          {isClosed ? "Closed" : "View & Apply"}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Job details" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#12263b" }}>{selectedJob.jobTitle}</h3>
                <div style={{ fontSize: 13, color: "#6c757d", marginTop: 4 }}>
                  {selectedJob.barangay} • {selectedJob.address}
                </div>
              </div>

              <button onClick={closeModal} aria-label="Close job details" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#6c757d", padding: 0 }}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {selectedJob.jobImage && (
                <div style={{ marginBottom: 12 }}>
                  <img src={selectedJob.jobImage} alt={selectedJob.jobTitle} style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 }} />
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "#44566a" }}>
                  <strong>Experience:</strong> {selectedJob.experience || "—"}
                </div>
                <div style={{ fontSize: 13, color: "#44566a" }}>
                  <strong>Contact:</strong> {selectedJob.contactNumber || "—"}
                </div>
                {selectedJob.applicantLimit ? (
                  <div style={{ fontSize: 13, color: "#44566a" }}>
                    <strong>Applicants Needed:</strong> {selectedJob.applicantLimit}
                  </div>
                ) : null}
              </div>

              <div style={{ fontSize: 14, color: "#223", lineHeight: 1.5, marginBottom: 12 }}>
                {selectedJob.jobDescription || "No description provided."}
              </div>

              {selectedJob.skills && (
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "#6c757d", fontWeight: 700, marginBottom: 8 }}>Skills</div>
                  <div className="skills-row">
                    {selectedJob.skills.split(",").map((s, i) => <div key={i} className="skill-pill">{s.trim()}</div>)}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e9ecef", fontSize: 13, color: "#44566a" }}>
                <strong>Employment Type:</strong> {selectedJob.jobType === "part-time" ? "Part-time" : "Full-time"}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeModal}>Close</button>

              {(() => {
                const appDoc = applications.find(app => app.jobId === selectedJob.id);
                const appStatus = appDoc?.status;
                
                // If already applied (pending, scheduled, or accepted) - show disabled
                if (appStatus === "pending" || appStatus === "scheduled" || appStatus === "accepted") {
                  return (
                    <button
                      className="btn-apply applied"
                      disabled
                      title="Already applied for this job"
                    >
                      ✓ Already Applied
                    </button>
                  );
                }

                // If rejected OR no application - allow to apply
                if (appStatus === "rejected" || !appStatus) {
                  return (
                    <button
                      className="btn-apply available"
                      onClick={() => handleApply(selectedJob)}
                      disabled={isApplying || (selectedJob.jobStatus || "approved") === "closed"}
                      title="Apply for this job"
                    >
                      {isApplying ? "Applying..." : (selectedJob.jobStatus || "approved") === "closed" ? "Job Closed" : "Apply Now"}
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerJobs;

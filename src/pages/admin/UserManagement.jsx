import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerification, setFilterVerification] = useState("all");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  // ===== REAL-TIME FETCH ALL USERS WITH COMPLETE DATA =====
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(usersQuery, async (userSnapshot) => {
      const userList = [];
      for (const docSnap of userSnapshot.docs) {
        const userData = docSnap.data();
        const userRole = userData.role?.toLowerCase().trim();
        if (userRole === "admin") continue;
        const normalizedRole = userRole?.replace(/_/g, " ");
        if (normalizedRole !== "job seeker" && normalizedRole !== "employer") continue;

        let isEmailVerified = false;
        if (userData.emailVerified === true || userData.emailVerified === "true") {
          isEmailVerified = true;
        }

        let userFiles = null;
        try {
          const filesDoc = await getDoc(doc(db, "userFiles", docSnap.id));
          if (filesDoc.exists()) {
            userFiles = filesDoc.data();
          }
        } catch {
          // No files found
        }

        userList.push({
          id: docSnap.id,
          uid: userData.uid || docSnap.id,
          fullName: userData.fullName || "N/A",
          email: userData.email || "N/A",
          role: normalizedRole || userData.role || "N/A",
          status: userData.status || "Active",
          emailVerified: isEmailVerified,
          createdAt: userData.createdAt || null,
          updatedAt: userData.updatedAt || null,
          companyName: userData.companyName || "",
          contactPerson: userData.contactPerson || "",
          contactNumber: userData.contactNumber || userData.phone || "",
          barangay: userData.barangay || "",
          address: userData.address || "",
          positionHiringFor: userData.positionHiringFor || "",
          jobDescription: userData.jobDescription || "",
          age: userData.age || "",
          gender: userData.gender || "",
          desiredJob: userData.desiredJob || "",
          experience: userData.experience || "",
          education: userData.education || "",
          skills: userData.skills || "",
          coverLetter: userData.coverLetter || "",
          userFiles: userFiles,
          phone: userData.phone || "",
        });
      }

      userList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setUsers(userList);
      setLoading(false);
    }, () => {
      setMessage("Error fetching users");
      setMessageType("error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ===== APPLY FILTERS & SEARCH =====
  useEffect(() => {
    let filtered = users;
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role.toLowerCase() === filterRole);
    }
    if (filterVerification !== "all") {
      if (filterVerification === "verified") {
        filtered = filtered.filter((user) => user.emailVerified === true);
      } else if (filterVerification === "not-verified") {
        filtered = filtered.filter((user) => user.emailVerified === false);
      }
    }
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
      );
    }
    setFilteredUsers(filtered);
  }, [users, filterRole, filterVerification, searchQuery]);

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
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

  // ===== OPEN USER PROFILE =====
  const openUserProfile = async (user) => {
    setUserProfileLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let userFiles = null;
        try {
          const filesDoc = await getDoc(doc(db, "userFiles", user.id));
          if (filesDoc.exists()) {
            userFiles = filesDoc.data();
          }
        } catch {
          // No files found
        }
        setSelectedUserProfile({
          ...userData,
          id: user.id,
          uid: user.id,
          userFiles: userFiles,
        });
        setShowUserProfileModal(true);
      }
    } catch {
      setMessage("Error loading user profile");
      setMessageType("error");
    } finally {
      setUserProfileLoading(false);
    }
  };

  const closeUserProfile = () => {
    setShowUserProfileModal(false);
    setSelectedUserProfile(null);
    setViewingDocument(null);
  };

  const openDocumentViewer = (documentType) => {
    if (documentType === "resume" && selectedUserProfile?.userFiles?.resumeBase64) {
      setViewingDocument({
        type: "resume",
        data: selectedUserProfile.userFiles.resumeBase64,
        name: selectedUserProfile.userFiles.resumeName || "Resume",
      });
    } else if (documentType === "document" && selectedUserProfile?.userFiles?.documentBase64) {
      setViewingDocument({
        type: "document",
        data: selectedUserProfile.userFiles.documentBase64,
        name: selectedUserProfile.userFiles.documentName || "Document",
      });
    }
  };

  const getRoleBadge = (role) => {
    if (role?.toLowerCase() === "employer") {
      return { bg: "#f0f8e9", border: "#d1e8c0", text: "#2d5016", label: " Employer" };
    } else {
      return { bg: "#f0f8e9", border: "#d1e8c0", text: "#2d5016", label: " Job Seeker" };
    }
  };

  const getVerificationBadge = (emailVerified) => {
    if (emailVerified === true) {
      return { bg: "#d4edda", border: "#c3e6cb", text: "#155724", label: "Verified", icon: "🟢" };
    } else {
      return { bg: "#fff3cd", border: "#ffe6b3", text: "#856404", label: "Not Verified", icon: "⭕" };
    }
  };

  const stats = {
    total: users.length,
    verified: users.filter((u) => u.emailVerified === true).length,
    notVerified: users.filter((u) => u.emailVerified === false).length,
  };

  const UserProfileModalContent = ({ user }) => {
    if (!user) return null;
    const isEmployer = user.role?.toLowerCase().replace(/_/g, " ") === "employer";
    return (
      <div className="profile-modal-body">
        {/* Header */}
        <div className="profile-modal-header-section">
          <div className="profile-modal-avatar">
            {user.userFiles?.photoBase64 ? (
              <img src={user.userFiles.photoBase64} alt={user.fullName} />
            ) : (
              (user.fullName || "").split(" ").map((n) => n.charAt(0)).slice(0, 2).join("")
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
              {user.fullName || "N/A"}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#6c757d" }}>
              {isEmployer ? user.companyName || "N/A" : user.desiredJob || "N/A"}
            </p>
            <div style={{ marginTop: 8 }}>
              {getVerificationBadge(user.emailVerified).icon} 
              <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>
                {getVerificationBadge(user.emailVerified).label}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="profile-modal-section">
          <h4 className="profile-modal-section-title">Basic Information</h4>
          <div className="profile-modal-grid">
            <div className="profile-modal-field">
              <span className="profile-modal-label">Email</span>
              <span className="profile-modal-value">{user.email || "N/A"}</span>
            </div>
            <div className="profile-modal-field">
              <span className="profile-modal-label">Phone</span>
              <span className="profile-modal-value">{user.phone || user.contactNumber || "N/A"}</span>
            </div>
            <div className="profile-modal-field">
              <span className="profile-modal-label">Barangay</span>
              <span className="profile-modal-value">{user.barangay || "N/A"}</span>
            </div>
            <div className="profile-modal-field">
              <span className="profile-modal-label">Address</span>
              <span className="profile-modal-value">{user.address || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Role-Specific Info */}
        {isEmployer ? (
          <div className="profile-modal-section">
            <h4 className="profile-modal-section-title">Employer Information</h4>
            <div className="profile-modal-grid">
              <div className="profile-modal-field full-width">
                <span className="profile-modal-label">Company Name</span>
                <span className="profile-modal-value">{user.companyName || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Contact Person</span>
                <span className="profile-modal-value">{user.contactPerson || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Position Hiring For</span>
                <span className="profile-modal-value">{user.positionHiringFor || "N/A"}</span>
              </div>
              {user.jobDescription && (
                <div className="profile-modal-field full-width">
                  <span className="profile-modal-label">Job Description</span>
                  <span className="profile-modal-value" style={{ lineHeight: 1.5 }}>
                    {user.jobDescription}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="profile-modal-section">
            <h4 className="profile-modal-section-title">Job Seeker Information</h4>
            <div className="profile-modal-grid">
              <div className="profile-modal-field">
                <span className="profile-modal-label">Age</span>
                <span className="profile-modal-value">{user.age || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Gender</span>
                <span className="profile-modal-value">{user.gender || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Desired Position</span>
                <span className="profile-modal-value">{user.desiredJob || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Experience</span>
                <span className="profile-modal-value">{user.experience || "N/A"}</span>
              </div>
              <div className="profile-modal-field">
                <span className="profile-modal-label">Education</span>
                <span className="profile-modal-value">{user.education || "N/A"}</span>
              </div>
              {user.skills && (
                <div className="profile-modal-field full-width">
                  <span className="profile-modal-label">Skills</span>
                  <span className="profile-modal-value">{user.skills}</span>
                </div>
              )}
              {user.coverLetter && (
                <div className="profile-modal-field full-width">
                  <span className="profile-modal-label">Cover Letter</span>
                  <span className="profile-modal-value" style={{ lineHeight: 1.5 }}>
                    {user.coverLetter}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files Section */}
        {user.userFiles && (user.userFiles.photoBase64 || user.userFiles.resumeBase64 || user.userFiles.documentBase64) && (
          <div className="profile-modal-section">
            <h4 className="profile-modal-section-title">Uploaded Files</h4>
            
            {user.userFiles.photoBase64 && (
              <div style={{ marginBottom: 12 }}>
                <span className="profile-modal-label">Profile Photo</span>
                <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", maxHeight: 200 }}>
                  <img 
                    src={user.userFiles.photoBase64} 
                    alt="Profile" 
                    style={{ maxWidth: "100%", maxHeight: 200, objectFit: "cover" }}
                  />
                </div>
              </div>
            )}

            {user.userFiles.resumeBase64 && (
              <div style={{ marginBottom: 12, padding: 10, background: "#f7fbff", borderRadius: 8, border: "1px solid #c5dff0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="profile-modal-label">📄 Resume: {user.userFiles.resumeName || "Resume"}</span>
                  <button
                    onClick={() => openDocumentViewer("resume")}
                    style={{
                      padding: "6px 12px",
                      background: "#0d6efd",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 11,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#0b5ed7"}
                    onMouseLeave={(e) => e.target.style.background = "#0d6efd"}
                  >
                    View
                  </button>
                </div>
              </div>
            )}

            {user.userFiles.documentBase64 && (
              <div style={{ marginBottom: 12, padding: 10, background: "#f0f8e9", borderRadius: 8, border: "1px solid #d1e8c0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="profile-modal-label">📄 Business Document: {user.userFiles.documentName || "Document"}</span>
                  <button
                    onClick={() => openDocumentViewer("document")}
                    style={{
                      padding: "6px 12px",
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 11,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#218838"}
                    onMouseLeave={(e) => e.target.style.background = "#28a745"}
                  >
                    View
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="user-management-root">
      <style>{`
        .user-management-root {
          padding: 20px;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #12263b;
          background: #fbfdff;
          min-height: 100vh;
        }

        .management-header {
          margin-bottom: 24px;
        }

        .management-title {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #000000;
        }

        .management-subtitle {
          color: #6c757d;
          font-size: 13px;
          margin: 4px 0 0 0;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
          font-size: 28px;
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
          padding: 8px 12px;
          border: 1.5px solid #eef4fb;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
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

        .message {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .user-card {
          background: #fff;
          border: 1px solid #eef4fb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.12s ease;
          display: flex;
          flex-direction: column;
        }

        .user-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
          border-color: #0d6efd;
        }

        .card-header {
          padding: 16px;
          background: linear-gradient(135deg, #fbfdff, #f7fbff);
          border-bottom: 1px solid #eef4fb;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f0f7ff, #fafcff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
          font-weight: 800;
          font-size: 18px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-header-info {
          flex: 1;
          min-width: 0;
        }

        .card-name {
          font-size: 14px;
          font-weight: 800;
          color: #12263b;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-email {
          font-size: 12px;
          color: #6c757d;
          margin: 4px 0 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-verification {
          position: relative;
        }

        .verification-star {
          font-size: 22px;
          cursor: default;
        }

        .card-body {
          padding: 12px 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-badge-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          border: 1.5px solid;
          white-space: nowrap;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-info-item {
          font-size: 12px;
          color: #44566a;
        }

        .card-info-label {
          color: #6c757d;
          font-weight: 700;
        }

        .card-footer {
          padding: 12px 16px;
          border-top: 1px solid #eef4fb;
          display: flex;
          gap: 8px;
        }

        .btn-view {
          flex: 1;
          padding: 8px 12px;
          background: #0d6efd;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          transition: all 0.12s ease;
        }

        .btn-view:hover {
          background: #0b5ed7;
          transform: translateY(-2px);
        }

        .btn-delete {
          flex: 1;
          padding: 8px 12px;
          background: #dc3545;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          transition: all 0.12s ease;
        }

        .btn-delete:hover {
          background: #c82333;
          transform: translateY(-2px);
        }

        .btn-delete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
          grid-column: 1 / -1;
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
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .skeleton-card {
          background: #fff;
          border: 1px solid #eef4fb;
          border-radius: 12px;
          overflow: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          height: 12px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
        }

        .skeleton-avatar {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f0f4f9 25%, #e9eef6 50%, #f0f4f9 75%);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

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
          max-width: 500px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.4);
          overflow: hidden;
          animation: slideUp 0.18s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .profile-modal {
          max-width: 700px;
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
          font-size: 16px;
          font-weight: 800;
          color: #12263b;
        }

        .modal-body {
          padding: 18px 20px;
        }

        .modal-body p {
          margin: 0 0 12px 0;
          color: #44566a;
          font-size: 13px;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #eef4fb;
          justify-content: flex-end;
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

        .btn-confirm {
          background: #dc3545;
          color: #fff;
          border: none;
        }

        .btn-confirm:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
        }

        .btn-confirm:disabled {
          background: #adb5bd;
          cursor: not-allowed;
          transform: none;
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

        .profile-modal-body {
          padding: 18px 20px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .profile-modal-header-section {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #eef4fb;
        }

        .profile-modal-avatar {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e9f4ff, #f7fbff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
          font-weight: 800;
          font-size: 20px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .profile-modal-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-modal-section {
          margin-bottom: 16px;
        }

        .profile-modal-section-title {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 800;
          color: #12263b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .profile-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .profile-modal-field {
          background: #fbfdff;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #eef4fb;
        }

        .profile-modal-field.full-width {
          grid-column: 1 / -1;
        }

        .profile-modal-label {
          font-size: 11px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: block;
          margin-bottom: 4px;
        }

        .profile-modal-value {
          font-size: 13px;
          color: #12263b;
          font-weight: 600;
          word-break: break-word;
        }

        .document-viewer {
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .document-viewer iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        @media (max-width: 768px) {
          .users-grid {
            grid-template-columns: 1fr;
          }

          .controls {
            grid-template-columns: 1fr;
          }

          .modal {
            max-width: 90%;
          }

          .profile-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="management-header">
        <h1 className="management-title">User Management</h1>
        <p className="management-subtitle">View, filter, and manage all users</p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`message ${messageType}`}>
          <span>{messageType === "success" ? "✓" : "✕"}</span>
          {message}
        </div>
      )}

      {/* STATS */}
      <div className="stats">
        <div className="stat-box">
          <p className="stat-value">{stats.total}</p>
          <p className="stat-label">Total Users</p>
        </div>
        <div className="stat-box">
          <p className="stat-value" style={{ color: "#28a745" }}>
            {stats.verified}
          </p>
          <p className="stat-label">Verified</p>
        </div>
        <div className="stat-box">
          <p className="stat-value" style={{ color: "#ff9800" }}>
            {stats.notVerified}
          </p>
          <p className="stat-label">Not Verified</p>
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filterRole === "all" ? "active" : ""}`}
            onClick={() => setFilterRole("all")}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${filterRole === "job seeker" ? "active" : ""}`}
            onClick={() => setFilterRole("job seeker")}
          >
            Job Seekers
          </button>
          <button
            className={`filter-btn ${filterRole === "employer" ? "active" : ""}`}
            onClick={() => setFilterRole("employer")}
          >
            Employers
          </button>
        </div>
      </div>

      {/* VERIFICATION FILTER */}
      <div className="filter-group" style={{ marginBottom: 20 }}>
        <button
          className={`filter-btn ${filterVerification === "all" ? "active" : ""}`}
          onClick={() => setFilterVerification("all")}
        >
          All Status
        </button>
        <button
          className={`filter-btn ${filterVerification === "verified" ? "active" : ""}`}
          onClick={() => setFilterVerification("verified")}
        >
          🟢 Verified
        </button>
        <button
          className={`filter-btn ${filterVerification === "not-verified" ? "active" : ""}`}
          onClick={() => setFilterVerification("not-verified")}
        >
          ⭕ Not Verified
        </button>
      </div>

      {/* USERS GRID */}
      {loading ? (
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="skeleton-avatar"></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line" style={{ width: "80%" }}></div>
                  <div className="skeleton-line" style={{ marginTop: 6, width: "100%" }}></div>
                </div>
              </div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <p className="empty-title">No users found</p>
          <p className="empty-text">
            {searchQuery
              ? "Try a different search query"
              : "No users available"}
          </p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => {
            const roleBadge = getRoleBadge(user.role);
            const verificationBadge = getVerificationBadge(user.emailVerified);
            const userInitials = (user.fullName || "")
              .split(" ")
              .map((n) => n.charAt(0))
              .slice(0, 2)
              .join("")
              .toUpperCase() || "U";

            return (
              <div key={user.id} className="user-card">
                <div className="card-header">
                  <div className="card-avatar">
                    {user.userFiles?.photoBase64 ? (
                      <img src={user.userFiles.photoBase64} alt={user.fullName} />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="card-header-info">
                    <h3 className="card-name">{user.fullName}</h3>
                    <p className="card-email">{user.email}</p>
                  </div>
                  <div className="card-verification">
                    <span className="verification-star" title={verificationBadge.label}>
                      {verificationBadge.icon}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="card-badge-group">
                    <div
                      className="card-badge"
                      style={{
                        background: roleBadge.bg,
                        borderColor: roleBadge.border,
                        color: roleBadge.text,
                      }}
                    >
                      {roleBadge.label}
                    </div>
                    <div
                      className="card-badge"
                      style={{
                        background: verificationBadge.bg,
                        borderColor: verificationBadge.border,
                        color: verificationBadge.text,
                      }}
                    >
                      {verificationBadge.label}
                    </div>
                  </div>

                  <div className="card-info">
                    <div className="card-info-item">
                      <span className="card-info-label">Location:</span> {user.barangay || "N/A"}
                    </div>
                    <div className="card-info-item">
                      <span className="card-info-label">Phone:</span> {user.contactNumber || user.phone || "N/A"}
                    </div>
                    {user.role?.toLowerCase().replace(/_/g, " ") === "employer" ? (
                      <div className="card-info-item">
                        <span className="card-info-label">Company:</span> {user.companyName || "N/A"}
                      </div>
                    ) : (
                      <div className="card-info-item">
                        <span className="card-info-label">Position:</span> {user.desiredJob || "N/A"}
                      </div>
                    )}
                    <div className="card-info-item">
                      <span className="card-info-label">Joined:</span> {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn-view"
                    onClick={() => openUserProfile(user)}
                    disabled={userProfileLoading}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {showUserProfileModal && selectedUserProfile && (
        <div
          className="modal-overlay"
          onClick={closeUserProfile}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{selectedUserProfile.fullName}</h3>
              <button
                className="btn-close"
                onClick={closeUserProfile}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            {userProfileLoading ? (
              <div className="modal-body" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#6c757d" }}>Loading profile...</div>
              </div>
            ) : (
              <>
                <UserProfileModalContent user={selectedUserProfile} />
              </>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewingDocument && (
        <div
          className="modal-overlay"
          onClick={() => setViewingDocument(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal profile-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh" }}
          >
            <div className="modal-header">
              <h3>📄 {viewingDocument.name}</h3>
              <button
                className="btn-close"
                onClick={() => setViewingDocument(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <iframe
                src={viewingDocument.data}
                className="document-viewer"
                title={viewingDocument.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
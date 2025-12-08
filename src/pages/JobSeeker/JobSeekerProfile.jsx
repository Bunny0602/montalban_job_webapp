import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";

const JobSeekerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userFiles, setUserFiles] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    barangay: "",
    desiredJob: "",
    experience: "",
    education: "",
    skills: "",
    coverLetter: "",
  });

  // ADD NEW STATES FOR FILE EDITING
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editResumeFile, setEditResumeFile] = useState(null);

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

  const genders = ["Male", "Female", "Prefer not to say"];
  const educationLevels = [
    "No Education",
    "Elementary Grad",
    "High School Grad",
    "Senior High Grad",
    "College Grad",
  ];

  // Fetch user files on mount
  useEffect(() => {
    const fetchUserFiles = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const filesDoc = await getDoc(doc(db, "userFiles", user.uid));
          if (filesDoc.exists()) {
            setUserFiles(filesDoc.data());
          }

          // Fetch last updated timestamp
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().updatedAt) {
            setLastUpdated(userDoc.data().updatedAt);
          }
        }
      } catch (error) {
        console.error("Error fetching user files:", error);
      }
    };

    fetchUserFiles();
  }, []);

  const loadProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || userData.contactNumber || "",
          age: userData.age || "",
          gender: userData.gender || "",
          address: userData.address || "",
          barangay: userData.barangay || "",
          desiredJob: userData.desiredJob || "",
          experience: userData.experience || "",
          education: userData.education || "",
          skills: userData.skills || "",
          coverLetter: userData.coverLetter || "",
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const skillList = (formData.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initials =
    (formData.fullName || "")
      .split(" ")
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join("") || "JS";

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return "Never";
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return "Never";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Photo must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setMessage("❌ Only JPG, JPEG, PNG allowed");
        return;
      }
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setMessage("");
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Resume must be less than 5MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        setMessage("❌ Only PDF, DOC, DOCX allowed for resume");
        return;
      }
      setEditResumeFile(file);
      setMessage("");
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        if (base64String.length > 900000) {
          reject(new Error(`File "${file.name}" is too large. Please upload a smaller file.`));
        } else {
          resolve(base64String);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle Save to update profile
  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setMessage("❌ Full name is required.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setMessage("❌ User not authenticated.");
        return;
      }

      // Update user profile with timestamp
      await updateDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        gender: formData.gender,
        barangay: formData.barangay,
        address: formData.address,
        desiredJob: formData.desiredJob,
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education,
        coverLetter: formData.coverLetter,
        contactNumber: formData.phone,
        updatedAt: serverTimestamp(),
      });

      // Update files if any new files were uploaded
      if (editPhotoFile || editResumeFile) {
        const filesRef = doc(db, "userFiles", user.uid);
        const updateData = {
          updatedAt: serverTimestamp(),
        };

        if (editPhotoFile) {
          const photoBase64 = await fileToBase64(editPhotoFile);
          updateData.photoBase64 = photoBase64;
          updateData.photoName = editPhotoFile.name;
        }

        if (editResumeFile) {
          const resumeBase64 = await fileToBase64(editResumeFile);
          updateData.resumeBase64 = resumeBase64;
          updateData.resumeName = editResumeFile.name;
        }

        await updateDoc(filesRef, updateData);

        // Fetch updated files
        const filesDoc = await getDoc(filesRef);
        if (filesDoc.exists()) {
          setUserFiles(filesDoc.data());
        }
      }

      // Update lastUpdated state
      setLastUpdated(new Date());

      setMessage("✅ Profile updated successfully!");
      setIsEditing(false);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
      setEditResumeFile(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("❌ Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    await loadProfile(); // Reload from database
    setIsEditing(false);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setEditResumeFile(null);
    setMessage("");
  };

  const downloadFile = (base64Data, fileName) => {
    try {
      const byteCharacters = atob(base64Data.split(",")[1] || base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading file:", error);
      setMessage("❌ Error downloading file");
    }
  };

  return (
    <div className="jobseeker-profile-container">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .jobseeker-profile-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .message-alert {
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          border-left: 4px solid;
          animation: slideDown 0.3s ease-out;
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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 28px;
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .profile-avatar-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-weight: 800;
          font-size: 32px;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.05);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: 14px;
          cursor: pointer;
        }

        .profile-avatar-wrapper:hover .avatar-overlay {
          opacity: 1;
        }

        .avatar-overlay-text {
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .profile-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 800;
          color: #222;
          margin: 0;
        }

        .profile-title {
          font-size: 15px;
          color: #6c757d;
          margin: 0;
        }

        .profile-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .meta-badge {
          background: #f0f8ff;
          color: #0d6efd;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .profile-last-updated {
          font-size: 11px;
          color: #6c757d;
          margin-top: 8px;
          font-style: italic;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .btn-primary {
          background: #0d6efd;
          color: #fff;
          box-shadow: 0 6px 20px rgba(13, 110, 253, 0.12);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(13, 110, 253, 0.16);
        }

        .btn-cancel {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #6c757d;
        }

        .btn-cancel:hover {
          background: #e9ecef;
        }

        .btn-download {
          background: #17a2b8;
          color: #fff;
          padding: 8px 12px;
          font-size: 12px;
        }

        .btn-download:hover {
          background: #138496;
          transform: translateY(-2px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .profile-section {
          background: #fff;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #222;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .info-field {
          background: #f8f9fa;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .field-label {
          font-size: 11px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: block;
        }

        .field-value {
          font-size: 14px;
          color: #222;
          font-weight: 600;
          word-break: break-word;
        }

        .skills-container {
          background: #f8f9fa;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .skills-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .skill-tag {
          background: linear-gradient(135deg, #e9f4ff, #f7fbff);
          color: #0d6efd;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #d4e3ff;
        }

        .no-skills {
          color: #6c757d;
          font-style: italic;
          font-size: 13px;
        }

        .file-item {
          background: #f8f9fa;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .file-preview-btn {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          background: #f0f0f0;
          border: 2px solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
          flex-shrink: 0;
        }

        .file-preview-btn:hover {
          border-color: #0d6efd;
          transform: scale(1.05);
        }

        .file-preview-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-size: 13px;
          color: #222;
          font-weight: 600;
          word-break: break-word;
          margin-bottom: 4px;
        }

        .file-type {
          font-size: 11px;
          color: #6c757d;
          font-weight: 500;
        }

        .file-actions {
          display: flex;
          gap: 8px;
        }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: #fff;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

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

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #222;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          transition: color 0.2s ease;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #222;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 70vh;
          overflow-y: auto;
        }

        .modal-body img {
          max-width: 100%;
          max-height: 100%;
          border-radius: 12px;
          object-fit: contain;
        }

        .pdf-viewer {
          width: 100%;
          height: 500px;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #e9ecef;
        }

        /* Edit Mode */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-grid.full {
          grid-template-columns: 1fr;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 11px 12px;
          border-radius: 10px;
          border: 1.5px solid #e9ecef;
          background: #fff;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          background: #fbfdff;
        }

        .form-input::placeholder {
          color: #adb5bd;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .edit-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        .form-hint {
          font-size: 11px;
          color: #6c757d;
          margin-top: 4px;
          font-style: italic;
        }

        .upload-box {
          border: 2px dashed #0d6efd;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: background .12s, border-color .12s;
          background: #f8fbff;
        }

        .upload-box:hover {
          background: #f0f8ff;
          border-color: #0051cc;
        }

        .upload-box input[type="file"] {
          display: none;
        }

        .upload-label {
          cursor: pointer;
          display: block;
          font-size: 14px;
          color: #0d6efd;
          font-weight: 600;
        }

        .upload-sublabel {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
        }

        .photo-preview-edit {
          width: 100%;
          height: 150px;
          border-radius: 10px;
          object-fit: cover;
          margin-top: 8px;
          border: 1px solid #e9eef6;
        }

        .file-info-edit {
          font-size: 12px;
          color: #28a745;
          margin-top: 6px;
          padding: 8px;
          background: #f0fdf4;
          border-radius: 6px;
        }

        .edit-file-section {
          background: #f8fbff;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e9ecef;
          margin-top: 12px;
        }

        .edit-file-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }

        .current-file-info {
          background: #fff;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e9ecef;
        }

        .current-file-icon {
          font-size: 16px;
        }

        .current-file-name {
          font-size: 12px;
          color: #222;
          font-weight: 600;
          flex: 1;
          word-break: break-word;
        }

        .replace-file-btn {
          font-size: 11px;
          color: #0d6efd;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
          padding: 0;
        }

        .replace-file-btn:hover {
          color: #0b5ed7;
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .profile-actions {
            width: 100%;
            justify-content: center;
          }

          .btn {
            flex: 1;
            justify-content: center;
          }

          .section-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .edit-actions {
            flex-direction: column;
          }

          .edit-actions .btn {
            width: 100%;
          }

          .profile-meta {
            justify-content: center;
          }

          .file-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .file-actions {
            width: 100%;
          }

          .file-actions .btn {
            flex: 1;
            justify-content: center;
          }

          .modal-body {
            max-height: 50vh;
          }

          .pdf-viewer {
            height: 400px;
          }
        }
      `}</style>

      {message && (
        <div
          className={`message-alert ${
            message.includes("Error") || message.includes("❌") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      {/* PHOTO MODAL */}
      {showPhotoModal && userFiles?.photoBase64 && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Profile Photo</h2>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <img src={userFiles.photoBase64} alt="Profile" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowPhotoModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUME MODAL */}
      {showResumeModal && userFiles?.resumeBase64 && (
        <div className="modal-overlay" onClick={() => setShowResumeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Resume</h2>
              <button className="modal-close" onClick={() => setShowResumeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {userFiles.resumeName?.endsWith('.pdf') ? (
                <iframe 
                  src={userFiles.resumeBase64} 
                  className="pdf-viewer"
                  title="Resume PDF"
                />
              ) : (
                <img src={userFiles.resumeBase64} alt="Resume" />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowResumeModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEditing ? (
        <>
          {/* PROFILE HEADER */}
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div 
                className="profile-avatar"
                onClick={() => userFiles?.photoBase64 && setShowPhotoModal(true)}
              >
                {userFiles?.photoBase64 ? (
                  <img src={userFiles.photoBase64} alt="Profile" />
                ) : (
                  initials
                )}
              </div>
              {userFiles?.photoBase64 && (
                <div className="avatar-overlay" onClick={() => setShowPhotoModal(true)}>
                  <div className="avatar-overlay-text">View Photo</div>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{formData.fullName || "Job Seeker"}</h2>
              <p className="profile-title">{formData.desiredJob || "Position not specified"}</p>
              <div className="profile-meta">
                <div className="meta-badge">{formData.barangay || "Location"}</div>
                <div className="meta-badge">{formData.phone || "No contact"}</div>
                <div className="meta-badge">{formData.experience || "0"} yrs exp</div>
              </div>
              {lastUpdated && (
                <div className="profile-last-updated">
                  Last updated: {formatLastUpdated(lastUpdated)}
                </div>
              )}
            </div>
            <div className="profile-actions">
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          </div>

          {/* PERSONAL INFO */}
          <div className="profile-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="section-grid">
              <div className="info-field">
                <span className="field-label">Full Name</span>
                <div className="field-value">{formData.fullName || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Age</span>
                <div className="field-value">{formData.age || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Gender</span>
                <div className="field-value">{formData.gender || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Contact Number</span>
                <div className="field-value">{formData.phone || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Barangay</span>
                <div className="field-value">{formData.barangay || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Address</span>
                <div className="field-value">{formData.address || "—"}</div>
              </div>
            </div>
          </div>

          {/* PROFESSIONAL INFO */}
          <div className="profile-section">
            <h3 className="section-title">Professional Information</h3>
            <div className="section-grid">
              <div className="info-field">
                <span className="field-label">Desired Position</span>
                <div className="field-value">{formData.desiredJob || "—"}</div>
              </div>
              <div className="info-field">
                <span className="field-label">Years of Experience</span>
                <div className="field-value">
                  {formData.experience || "—"} {formData.experience && formData.experience !== "—" ? "years" : ""}
                </div>
              </div>
              <div className="info-field">
                <span className="field-label">Education Level</span>
                <div className="field-value">{formData.education || "—"}</div>
              </div>
            </div>

            {/* SKILLS */}
            <div style={{ marginTop: 16 }}>
              <h4 className="section-title" style={{ marginBottom: 12, fontSize: "15px" }}>
                Skills
              </h4>
              <div className="skills-container">
                {skillList.length > 0 ? (
                  <div className="skills-list">
                    {skillList.map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <div className="no-skills">No skills listed yet</div>
                )}
              </div>
            </div>
          </div>

          {/* FILES SECTION */}
          {userFiles && (
            <div className="profile-section">
              <h3 className="section-title">Uploaded Files</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {userFiles.photoBase64 && (
                  <div className="file-item">
                    <div 
                      className="file-preview-btn"
                      onClick={() => setShowPhotoModal(true)}
                    >
                      <img src={userFiles.photoBase64} alt="Photo preview" />
                    </div>
                    <div className="file-details">
                      <div className="field-label">Profile Photo</div>
                      <div className="file-name">{userFiles.photoName || "Photo.jpg"}</div>
                      <div className="file-type">Image File</div>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowPhotoModal(true)}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-download"
                        onClick={() => downloadFile(userFiles.photoBase64, userFiles.photoName || "photo")}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {userFiles.resumeBase64 && (
                  <div className="file-item">
                    <div 
                      className="file-preview-btn"
                      onClick={() => setShowResumeModal(true)}
                      style={{ background: "#f5f5f5", fontSize: 32 }}
                    >
                      📄
                    </div>
                    <div className="file-details">
                      <div className="field-label">Resume</div>
                      <div className="file-name">{userFiles.resumeName || "Resume"}</div>
                      <div className="file-type">
                        {userFiles.resumeName?.endsWith('.pdf') ? 'PDF' : 'Document'}
                      </div>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowResumeModal(true)}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-download"
                        onClick={() => downloadFile(userFiles.resumeBase64, userFiles.resumeName || "resume")}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {!userFiles.photoBase64 && !userFiles.resumeBase64 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                    No files uploaded yet
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* EDIT MODE */}
          <div className="profile-section">
            <h3 className="section-title">Edit Profile</h3>

            <h4 style={{ fontSize: 14, color: "#555", marginBottom: 12, marginTop: 20 }}>Personal Information</h4>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g., 25"
                  min="18"
                  max="100"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  className="form-select" 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  {genders.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Barangay</label>
                <select 
                  className="form-select" 
                  name="barangay" 
                  value={formData.barangay} 
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </div>

              <div className="form-group full">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  disabled={loading}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9665235745"
                  maxLength="10"
                  disabled={loading}
                />
                <span className="form-hint">Format: 10 digits → stored as +639665235745</span>
              </div>
            </div>

            <h4 style={{ fontSize: 14, color: "#555", marginBottom: 12, marginTop: 20 }}>Professional Information</h4>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Desired Job Position</label>
                <input
                  type="text"
                  className="form-input"
                  name="desiredJob"
                  value={formData.desiredJob}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Developer, Manager"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="e.g., 3"
                  min="0"
                  max="60"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Education Level</label>
                <select 
                  className="form-select" 
                  name="education" 
                  value={formData.education} 
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Education</option>
                  {educationLevels.map((e) => (<option key={e} value={e}>{e}</option>))}
                </select>
              </div>

              <div className="form-group full">
                <label className="form-label">Skills</label>
                <textarea
                  className="form-textarea"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g., JavaScript, React, Node.js, MongoDB (comma separated)"
                  disabled={loading}
                />
              </div>

              <div className="form-group full">
                <label className="form-label">Cover Letter</label>
                <textarea
                  className="form-textarea"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  placeholder="Tell employers about yourself..."
                  disabled={loading}
                />
              </div>
            </div>

            <h4 style={{ fontSize: 14, color: "#555", marginBottom: 12, marginTop: 20 }}>Files</h4>
            <div className="form-grid full">
              {/* PROFILE PHOTO EDIT */}
              <div className="edit-file-section">
                <label className="edit-file-label">📷 Profile Photo</label>
                
                {(userFiles?.photoBase64 || editPhotoPreview) && (
                  <div className="current-file-info">
                    <span className="current-file-icon">✓</span>
                    <span className="current-file-name">
                      {editPhotoFile ? editPhotoFile.name : userFiles?.photoName || "profile-photo.jpg"}
                    </span>
                    <button 
                      type="button"
                      className="replace-file-btn"
                      onClick={() => document.getElementById("editPhotoInput").click()}
                      disabled={loading}
                    >
                      Replace
                    </button>
                  </div>
                )}

                <div className="upload-box" onClick={() => document.getElementById("editPhotoInput").click()}>
                  <input 
                    type="file" 
                    id="editPhotoInput"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={loading}
                  />
                  <label htmlFor="editPhotoInput" className="upload-label">
                    Click to upload photo
                  </label>
                  <div className="upload-sublabel">JPG, JPEG, PNG • Max 5MB</div>
                </div>

                {editPhotoPreview && (
                  <img src={editPhotoPreview} alt="New Preview" className="photo-preview-edit" />
                )}
                
                {editPhotoFile && (
                  <div className="file-info-edit">
                    ✓ {editPhotoFile.name} ({(editPhotoFile.size / 1024).toFixed(2)} KB) - New
                  </div>
                )}
              </div>

              {/* RESUME EDIT */}
              <div className="edit-file-section">
                <label className="edit-file-label">📄 Resume</label>
                
                {(userFiles?.resumeBase64 || editResumeFile) && (
                  <div className="current-file-info">
                    <span className="current-file-icon">✓</span>
                    <span className="current-file-name">
                      {editResumeFile ? editResumeFile.name : userFiles?.resumeName || "resume.pdf"}
                    </span>
                    <button 
                      type="button"
                      className="replace-file-btn"
                      onClick={() => document.getElementById("editResumeInput").click()}
                      disabled={loading}
                    >
                      Replace
                    </button>
                  </div>
                )}

                <div className="upload-box" onClick={() => document.getElementById("editResumeInput").click()}>
                  <input 
                    type="file" 
                    id="editResumeInput"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    disabled={loading}
                  />
                  <label htmlFor="editResumeInput" className="upload-label">
                    Click to upload resume
                  </label>
                  <div className="upload-sublabel">PDF, DOC, DOCX • Max 5MB</div>
                </div>

                {editResumeFile && (
                  <div className="file-info-edit">
                    ✓ {editResumeFile.name} ({(editResumeFile.size / 1024).toFixed(2)} KB) - New
                  </div>
                )}
              </div>
            </div>

            <div className="edit-actions">
              <button className="btn btn-cancel" onClick={handleCancel} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobSeekerProfile;

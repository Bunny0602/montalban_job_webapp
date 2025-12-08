import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const EmployerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userFiles, setUserFiles] = useState(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editDocFile, setEditDocFile] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    barangay: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    positionHiringFor: "",
    jobDescription: "",
  });

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

  // Fetch employer data on mount
  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch user document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            email: userData.email || "",
            companyName: userData.companyName || userData.fullName || "",
            barangay: userData.barangay || "",
            address: userData.address || "",
            contactPerson: userData.contactPerson || "",
            contactNumber: userData.contactNumber || "",
            positionHiringFor: userData.positionHiringFor || "",
            jobDescription: userData.jobDescription || "",
          });

          // Fetch last updated timestamp
          if (userData.updatedAt) {
            setLastUpdated(userData.updatedAt);
          }
        }

        // Fetch user files
        const filesDoc = await getDoc(doc(db, "userFiles", user.uid));
        if (filesDoc.exists()) {
          setUserFiles(filesDoc.data());
        }
      } catch (error) {
        console.error("Error fetching employer data:", error);
        setMessage("❌ Error loading profile data");
      }
    };

    fetchEmployerData();
  }, []);

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

  const initials =
    (formData.companyName || "")
      .split(" ")
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join("")?.toUpperCase() || "EM";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Document must be less than 5MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        setMessage("❌ Only PDF, DOC, DOCX allowed for document");
        return;
      }
      setEditDocFile(file);
      setMessage("");
      e.target.value = "";
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

  const handleSave = async () => {
    if (!formData.companyName.trim()) {
      setMessage("❌ Company name is required.");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setMessage("❌ User not authenticated.");
        return;
      }

      // Update users collection
      await updateDoc(doc(db, "users", user.uid), {
        companyName: formData.companyName,
        fullName: formData.companyName,
        barangay: formData.barangay,
        address: formData.address,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        positionHiringFor: formData.positionHiringFor,
        jobDescription: formData.jobDescription,
        updatedAt: serverTimestamp(),
      });

      // Mirror to employers collection
      try {
        await updateDoc(doc(db, "employers", user.uid), {
          email: formData.email,
          companyName: formData.companyName,
          fullName: formData.companyName,
          companyBarangay: formData.barangay,
          companyAddress: formData.address,
          contactPerson: formData.contactPerson,
          contactNumber: formData.contactNumber,
          positionHiringFor: formData.positionHiringFor,
          jobDescription: formData.jobDescription,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("employers doc update failed, creating new:", err);
        await setDoc(
          doc(db, "employers", user.uid),
          {
            email: formData.email,
            companyName: formData.companyName,
            fullName: formData.companyName,
            companyBarangay: formData.barangay,
            companyAddress: formData.address,
            contactPerson: formData.contactPerson,
            contactNumber: formData.contactNumber,
            positionHiringFor: formData.positionHiringFor,
            jobDescription: formData.jobDescription,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Update business document only if uploaded
      const filesRef = doc(db, "userFiles", user.uid);
      if (editDocFile) {
        const docBase64 = await fileToBase64(editDocFile);
        
        await updateDoc(filesRef, {
          documentBase64: docBase64,
          documentName: editDocFile.name,
          updatedAt: serverTimestamp(),
        });

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
      setEditDocFile(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("❌ Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            email: userData.email || "",
            companyName: userData.companyName || userData.fullName || "",
            barangay: userData.barangay || "",
            address: userData.address || "",
            contactPerson: userData.contactPerson || "",
            contactNumber: userData.contactNumber || "",
            positionHiringFor: userData.positionHiringFor || "",
            jobDescription: userData.jobDescription || "",
          });
        }
      }
    } catch (error) {
      console.error("Error canceling edit:", error);
    }
    setIsEditing(false);
    setMessage("");
    setEditDocFile(null);
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
    <div className="employer-root" role="region" aria-label="Employer profile">
      <style>{`
        .employer-root {
          max-width: 920px;
          margin: 18px auto;
          padding: 18px;
        }

        .message-alert {
          padding: 13px 16px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          border-left: 4px solid;
          animation: slideDown 0.20s ease;
        }

        .message-alert.success {
          border-color: #52d273;
          background: #f0faf7;
          color: #0b6b3a;
        }

        .message-alert.error {
          border-color: #ff6b7a;
          background: #fff0f1;
          color: #c82333;
        }

        @keyframes slideDown {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .employer-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.06);
          padding: 20px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          min-width: 0;
        }

        .emp-avatar-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          flex-shrink: 0;
        }

        .emp-avatar {
          min-width: 110px;
          min-height: 110px;
          width: 110px;
          height: 110px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f7ff, #fafcff);
          color: #0d6efd;
          font-weight: 800;
          font-size: 28px;
          box-shadow: 0 6px 18px rgba(13, 110, 253, 0.06);
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
          overflow: hidden;
        }

        .emp-avatar:hover {
          transform: scale(1.05);
        }

        .emp-avatar img {
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

        .emp-avatar-wrapper:hover .avatar-overlay {
          opacity: 1;
        }

        .avatar-overlay-text {
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .emp-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        .emp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .company-block { overflow: hidden; }

        .company-name {
          font-size: 20px;
          font-weight: 800;
          color: #12263b;
          margin: 0 0 6px 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .company-meta {
          font-size: 13px;
          color: #44566a;
          margin: 0 0 8px 0;
          word-break: break-word;
        }

        .last-updated {
          font-size: 11px;
          color: #6c757d;
          margin-top: 6px;
          font-style: italic;
        }

        .meta-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .chip {
          background: #fbfdff;
          border: 1px solid #e6f0ff;
          color: #235;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .actions-header {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.12s ease;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .btn-primary {
          background: #0d6efd;
          color: #fff;
          box-shadow: 0 8px 26px rgba(13, 110, 253, 0.10);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.14);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #f8fbff;
          border: 1px solid #e6f0ff;
          color: #0d6efd;
        }

        .btn-secondary:hover {
          background: #e9f4ff;
          transform: translateY(-2px);
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

        .emp-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .field {
          background: #fff;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid #f0f4f9;
          font-size: 14px;
        }

        .field .label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 6px;
          display: block;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .field .value {
          color: #0f1724;
          font-weight: 600;
          word-break: break-word;
        }

        .job-desc {
          background: #fff;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid #f0f4f9;
          font-size: 14px;
          color: #223;
          line-height: 1.45;
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
          from { opacity: 0; }
          to { opacity: 1; }
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
          font-size: 32px;
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

        /* Edit Mode Styles */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-input, .form-select, .form-textarea {
          padding: 11px 12px;
          border-radius: 10px;
          border: 1.5px solid #e9eef6;
          background: #fff;
          font-size: 14px;
          outline: none;
          transition: box-shadow 0.14s ease, border-color 0.14s ease;
          font-family: inherit;
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #adb5bd;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.12);
          border-color: #0d6efd;
          background: #fbfdff;
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .edit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .upload-box {
          border: 2px dashed #0d6efd;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: background .12s, border-color .12s;
          background: #f8fbff;
          margin-top: 8px;
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

        .file-info-edit {
          font-size: 12px;
          color: #28a745;
          margin-top: 6px;
          padding: 8px;
          background: #f0fdf4;
          border-radius: 6px;
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

        .edit-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          justify-content: flex-end;
        }

        .contact-btn {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 10px 14px;
          background: #0d6efd;
          color: #fff;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 26px rgba(13, 110, 253, 0.10);
          transition: all 0.12s ease;
        }

        .contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 110, 253, 0.14);
        }

        .contact-btn[aria-disabled="true"] {
          opacity: 0.7;
          pointer-events: none;
          transform: none;
        }

        @media (max-width: 720px) {
          .employer-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .emp-avatar {
            width: 96px;
            height: 96px;
            border-radius: 12px;
          }
          .emp-avatar-wrapper {
            width: 96px;
            height: 96px;
          }
          .emp-grid {
            grid-template-columns: 1fr;
            width: 100%;
          }
          .edit-grid {
            grid-template-columns: 1fr;
          }
          .emp-header {
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }
          .meta-row {
            justify-content: center;
          }
          .actions-header {
            justify-content: center;
            width: 100%;
            flex-direction: column;
            gap: 8px;
          }
          .contact-btn {
            width: 100%;
            justify-content: center;
          }
          .btn { width: 100%; justify-content: center; }
          .edit-actions {
            flex-direction: column;
            width: 100%;
          }
          .btn { width: 100%; }
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
        }
      `}</style>

      {message && (
        <div className={`message-alert ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* LOGO MODAL */}
      {showLogoModal && userFiles?.photoBase64 && (
        <div className="modal-overlay" onClick={() => setShowLogoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Company Logo</h2>
              <button className="modal-close" onClick={() => setShowLogoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <img src={userFiles.photoBase64} alt="Company Logo" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLogoModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS DOC MODAL */}
      {showDocModal && userFiles?.documentBase64 && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Business Document</h2>
              <button className="modal-close" onClick={() => setShowDocModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {userFiles.documentName?.endsWith('.pdf') ? (
                <iframe
                  src={userFiles.documentBase64}
                  className="pdf-viewer"
                  title="Business Document PDF"
                />
              ) : (
                <img src={userFiles.documentBase64} alt="Business Document" />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDocModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="employer-card">
        <div className="emp-avatar-wrapper">
          <div
            className="emp-avatar"
            onClick={() => userFiles?.photoBase64 && setShowLogoModal(true)}
          >
            {userFiles?.photoBase64 ? (
              <img src={userFiles.photoBase64} alt="Company Logo" />
            ) : (
              initials
            )}
          </div>
          {userFiles?.photoBase64 && (
            <div className="avatar-overlay" onClick={() => setShowLogoModal(true)}>
              <div className="avatar-overlay-text">👁️ View Logo</div>
            </div>
          )}
        </div>

        <div className="emp-main">
          {!isEditing ? (
            <>
              <div className="emp-header">
                <div className="company-block">
                  <h3 className="company-name">{formData.companyName || "—"}</h3>
                  <p className="company-meta">{formData.positionHiringFor || "—"}</p>
                  <p className="company-meta" style={{ fontSize: "12px" }}>{formData.email || "—"}</p>
                  {lastUpdated && (
                    <div className="last-updated">
                      Last updated: {formatLastUpdated(lastUpdated)}
                    </div>
                  )}

                  <div className="meta-row">
                    <div className="chip" title={`Contact person: ${formData.contactPerson}`}>
                      {formData.contactPerson || "—"}
                    </div>
                    <div className="chip" title={`Barangay: ${formData.barangay}`}>
                      {formData.barangay || "—"}
                    </div>
                  </div>
                </div>

                <div className="actions-header" role="group" aria-label="Employer actions">
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>

                  <a
                    className="contact-btn"
                    href={
                      formData.contactNumber && formData.contactNumber !== "—"
                        ? `tel:${formData.contactNumber}`
                        : "#"
                    }
                    aria-disabled={!formData.contactNumber || formData.contactNumber === "—"}
                    onClick={(e) => {
                      if (!formData.contactNumber || formData.contactNumber === "—")
                        e.preventDefault();
                    }}
                  >
                    {formData.contactNumber && formData.contactNumber !== "—"
                      ? formData.contactNumber
                      : "No Contact"}
                  </a>
                </div>
              </div>

              <div className="emp-grid">
                <div className="field">
                  <span className="label">Company Address</span>
                  <div className="value">{formData.address || "—"}</div>
                </div>

                <div className="field">
                  <span className="label">Hiring For</span>
                  <div className="value">{formData.positionHiringFor || "—"}</div>
                </div>

                <div className="field">
                  <span className="label">Contact Person</span>
                  <div className="value">{formData.contactPerson || "—"}</div>
                </div>

                <div className="field">
                  <span className="label">Barangay</span>
                  <div className="value">{formData.barangay || "—"}</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <span className="label" style={{ fontSize: 13, marginBottom: 8 }}>
                  Job Description
                </span>
                <div className="job-desc">
                  {formData.jobDescription || "No job description provided."}
                </div>
              </div>

              {/* FILES SECTION */}
              {userFiles && (
                <div style={{ marginTop: 16 }}>
                  <span className="label" style={{ fontSize: 13, marginBottom: 8 }}>
                    Uploaded Files
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {userFiles.photoBase64 && (
                      <div className="file-item">
                        <div
                          className="file-preview-btn"
                          onClick={() => setShowLogoModal(true)}
                        >
                          <img src={userFiles.photoBase64} alt="Logo preview" />
                        </div>
                        <div className="file-details">
                          <div className="file-name">{userFiles.photoName || "Logo.png"}</div>
                          <div className="file-type">Company Logo</div>
                        </div>
                        <div className="file-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowLogoModal(true)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-download"
                            onClick={() => downloadFile(userFiles.photoBase64, userFiles.photoName || "logo")}
                          >
                            ⬇Download
                          </button>
                        </div>
                      </div>
                    )}

                    {userFiles.documentBase64 && (
                      <div className="file-item">
                        <div
                          className="file-preview-btn"
                          onClick={() => setShowDocModal(true)}
                          style={{ fontSize: 32 }}
                        >
                          📄
                        </div>
                        <div className="file-details">
                          <div className="file-name">{userFiles.documentName || "Business Document"}</div>
                          <div className="file-type">
                            {userFiles.documentName?.endsWith('.pdf') ? 'PDF' : 'Document'}
                          </div>
                        </div>
                        <div className="file-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowDocModal(true)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-download"
                            onClick={() => downloadFile(userFiles.documentBase64, userFiles.documentName || "document")}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {!userFiles.photoBase64 && !userFiles.documentBase64 && (
                      <div style={{ padding: 16, textAlign: "center", color: "#6c757d", fontSize: 13 }}>
                        No files uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="label" style={{ fontSize: 13 }}>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  disabled
                  placeholder="Your email"
                />
                <small style={{ fontSize: 11, color: "#6c757d" }}>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label className="label" style={{ fontSize: 13 }}>Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="edit-grid">
                <div className="form-group">
                  <label className="label" style={{ fontSize: 13 }}>Contact Person</label>
                  <input
                    type="text"
                    className="form-input"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: 13 }}>Contact Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: 13 }}>Barangay</label>
                  <select
                    className="form-select"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label" style={{ fontSize: 13 }}>Position Hiring For</label>
                  <input
                    type="text"
                    className="form-input"
                    name="positionHiringFor"
                    value={formData.positionHiringFor}
                    onChange={handleChange}
                    placeholder="e.g., Manager, Developer"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="label" style={{ fontSize: 13 }}>Company Address</label>
                <input
                  type="text"
                  className="form-input"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                />
              </div>

              <div className="form-group full-width">
                <label className="label" style={{ fontSize: 13 }}>Job Description</label>
                <textarea
                  className="form-textarea"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="Describe the job position and requirements..."
                />
              </div>

              {/* BUSINESS DOCUMENT EDIT */}
              <div className="form-group full-width" style={{ marginTop: 12 }}>
                <label className="label" style={{ fontSize: 13 }}>📄 Business Document</label>
                
                {(userFiles?.documentBase64 || editDocFile) && (
                  <div className="current-file-info">
                    <span className="current-file-icon">✓</span>
                    <span className="current-file-name">
                      {editDocFile ? editDocFile.name : userFiles?.documentName || "document.pdf"}
                    </span>
                    <button 
                      type="button"
                      className="replace-file-btn"
                      onClick={() => document.getElementById("editDocInput").click()}
                      disabled={loading}
                    >
                      Replace
                    </button>
                  </div>
                )}

                <div className="upload-box">
                  <input 
                    type="file" 
                    id="editDocInput"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocChange}
                    disabled={loading}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="editDocInput" className="upload-label" style={{ marginBottom: 0 }}>
                    Click to upload business document
                  </label>
                  <div className="upload-sublabel">PDF, DOC, DOCX • Max 5MB</div>
                </div>

                {editDocFile && (
                  <div className="file-info-edit">
                    ✓ {editDocFile.name} ({(editDocFile.size / 1024).toFixed(2)} KB) - New
                  </div>
                )}
              </div>

              <div className="edit-actions">
                <button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;

// src/components/Register.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import TermsModal from "../../components/TermsModal";
import PrivacyModal from "../../components/PrivacyModal";

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    age: "",
    gender: "",
    barangay: "",
    address: "",
    desiredJob: "",
    skills: "",
    experience: "",
    education: "",
    contactNumber: "",
    photoFile: null,
    resumeFile: null,
    documentFile: null,
    companyName: "",
    contactPerson: "",
    positionHiringFor: "",
    jobDescription: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false); 
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [contactNumberError, setContactNumberError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    age: "",
    gender: "",
    barangay: "",
    address: "",
    desiredJob: "",
    skills: "",
    experience: "",
    education: "",
    contactNumber: "",
    photoFile: "",
    resumeFile: "",
    companyName: "",
    contactPerson: "",
    positionHiringFor: "",
    jobDescription: "",
    documentFile: "",
  });

  const barangays = [
    "Balite", "Burgos", "Geronimo", "Macabud", "Manggahan",
    "Mascap", "Puray", "Rosario", "San Isidro", "San Jose", "San Rafael"
  ];

  const educationOptions = [
    "No Education", "Elementary Grad", "High School Grad",
    "Senior High Grad", "College Grad"
  ];

  // Validate password strength
  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*;]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(v => v === true);
  };

  // Get password strength
  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(v => v === true).length;
    if (validCount <= 2) return { text: "Weak", color: "#dc3545" };
    if (validCount <= 4) return { text: "Medium", color: "#ffc107" };
    return { text: "Strong", color: "#28a745" };
  };

  // Validate contact number - PH format (must start with 9, total 10 digits)
  const validateContactNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, "");
    
    if (!cleanNumber) {
      setContactNumberError("");
      return true;
    }

    if (cleanNumber.length !== 10) {
      setContactNumberError("Contact number must be exactly 10 digits");
      return false;
    }

    if (cleanNumber[0] !== "9") {
      setContactNumberError("Contact number must start with 9 (PH format)");
      return false;
    }

    setContactNumberError("");
    return true;
  };

  // Validate individual fields
  const validateField = (name, value) => {
    let fieldError = "";

    switch(name) {
      case "fullName":
      case "companyName":
      case "contactPerson":
        if (value && value.trim().length < 2) {
          fieldError = "Must be at least 2 characters";
        }
        break;
      case "age":
        if (value && (isNaN(value) || value < 18 || value > 120)) {
          fieldError = "Age must be between 18 and 120";
        }
        break;
      case "gender":
      case "barangay":
      case "education":
        if (!value) {
          fieldError = "Please select an option";
        }
        break;
      case "address":
        if (value && value.trim().length < 5) {
          fieldError = "Address must be at least 5 characters";
        }
        break;
      case "desiredJob":
      case "positionHiringFor":
        if (value && value.trim().length < 2) {
          fieldError = "Must be at least 2 characters";
        }
        break;
      case "skills":
        if (value && value.trim().length < 3) {
          fieldError = "Must be at least 3 characters";
        }
        break;
      case "experience":
        if (value && (isNaN(value) || value < 0)) {
          fieldError = "Must be a valid number";
        }
        break;
      case "jobDescription":
        if (value && value.trim().length < 10) {
          fieldError = "Must be at least 10 characters";
        }
        break;
      default:
        break;
    }

    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));

    return !fieldError;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "password") {
      setFormData({ ...formData, [name]: value });
      validatePassword(value);
    } else if (name === "contactNumber") {
      // Only accept digits
      let numValue = value.replace(/\D/g, "");
      
      // Limit to 10 digits
      numValue = numValue.slice(0, 10);
      
      // Validate and show error if invalid
      validateContactNumber(numValue);
      validateField(name, numValue);
      
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
      validateField(name, value);
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setError("Only JPG, JPEG, PNG allowed");
        return;
      }
      setFormData({ ...formData, photoFile: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  // Handle resume upload
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Resume must be less than 5MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        setError("Only PDF, DOC, DOCX allowed for resume");
        return;
      }
      setFormData({ ...formData, resumeFile: file });
      setResumeName(file.name);
      setError("");
    }
  };

  // Handle document upload (for employer only)
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Document must be less than 5MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        setError("Only PDF, DOC, DOCX allowed");
        return;
      }
      setFormData({ ...formData, documentFile: file });
      setDocumentName(file.name);
      setError("");
    }
  };

  const handleNext = () => {
    const { email, password } = formData;
    if (!email || !password || !role) {
      setError("Please fill all fields and select a role.");
      return;
    }
    if (!email.endsWith("@gmail.com")) {
      setError("Only Gmail addresses are allowed.");
      return;
    }
    // Check password strength
    if (!validatePassword(password)) {
      setError("Password must meet all requirements.");
      return;
    }
    setError("");
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Convert file to Base64 with size check
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        // Check if base64 is too large (Firestore limit is ~1MB for a single field)
        if (base64String.length > 900000) {
          reject(new Error(`File "${file.name}" is too large. Please upload a smaller file.`));
        } else {
          resolve(base64String);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      let hasErrors = false;

      // Validate all fields
      if (role === "job_seeker") {
        const requiredFields = ["fullName", "gender", "barangay", "address", "desiredJob", "skills", "education", "contactNumber", "photoFile", "resumeFile"];
        for (let field of requiredFields) {
          if (!formData[field]) {
            setFormErrors(prev => ({
              ...prev,
              [field]: "This field is required"
            }));
            hasErrors = true;
          } else {
            validateField(field, formData[field]);
          }
        }
        if (!validateContactNumber(formData.contactNumber)) {
          hasErrors = true;
        }
      } else if (role === "employer") {
        const requiredFields = ["companyName", "barangay", "address", "contactPerson", "contactNumber", "positionHiringFor", "jobDescription", "documentFile"];
        for (let field of requiredFields) {
          if (!formData[field]) {
            setFormErrors(prev => ({
              ...prev,
              [field]: "This field is required"
            }));
            hasErrors = true;
          } else {
            validateField(field, formData[field]);
          }
        }
        if (!validateContactNumber(formData.contactNumber)) {
          hasErrors = true;
        }
      }

      if (hasErrors) {
        setError("Please fix all errors before proceeding.");
        setLoading(false);
        return;
      }

      setError("");

      // STEP 1: Store registration data in localStorage
      const registrationData = {
        email: formData.email,
        role: role,
        profile: {}
      };

      if (role === "job_seeker") {
        registrationData.profile = {
          fullName: formData.fullName,
          age: formData.age,
          gender: formData.gender,
          barangay: formData.barangay,
          address: formData.address,
          desiredJob: formData.desiredJob,
          skills: formData.skills,
          experience: formData.experience,
          education: formData.education,
          contactNumber: formData.contactNumber,
          photoName: formData.photoFile?.name,
          resumeName: formData.resumeFile?.name,
        };
      } else if (role === "employer") {
        registrationData.profile = {
          companyName: formData.companyName,
          barangay: formData.barangay,
          address: formData.address,
          contactPerson: formData.contactPerson,
          contactNumber: formData.contactNumber,
          positionHiringFor: formData.positionHiringFor,
          jobDescription: formData.jobDescription,
          documentName: formData.documentFile?.name,
        };
      }

      window.localStorage.setItem("registrationData", JSON.stringify(registrationData));

      // STEP 2: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      console.log("User created:", user.uid);

      // Store email and password temporarily for verification page
      localStorage.setItem("userEmail", formData.email);
      localStorage.setItem("userPassword", formData.password);

      // STEP 3: Convert files to Base64
      let photoBase64 = null;
      let resumeBase64 = null;
      let documentBase64 = null;

      try {
        if (formData.photoFile) {
          photoBase64 = await fileToBase64(formData.photoFile);
        }
      } catch (fileErr) {
        setError(`Photo error: ${fileErr.message}`);
        setLoading(false);
        return;
      }

      try {
        if (formData.resumeFile) {
          resumeBase64 = await fileToBase64(formData.resumeFile);
        }
      } catch (fileErr) {
        setError(`Resume error: ${fileErr.message}`);
        setLoading(false);
        return;
      }

      try {
        if (formData.documentFile) {
          documentBase64 = await fileToBase64(formData.documentFile);
        }
      } catch (fileErr) {
        setError(`Document error: ${fileErr.message}`);
        setLoading(false);
        return;
      }

      // STEP 4: Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: formData.email,
        role: role,
        emailVerified: false,
        createdAt: new Date(),
        fullName: role === "job_seeker" ? formData.fullName : formData.companyName,
        barangay: formData.barangay,
        address: formData.address,
        contactNumber: "+63" + formData.contactNumber,
        ...(role === "employer" && {
          contactPerson: formData.contactPerson,
        }),
        ...(role === "job_seeker" && {
          age: formData.age,
          gender: formData.gender,
          desiredJob: formData.desiredJob,
          skills: formData.skills,
          experience: formData.experience,
          education: formData.education,
        }),
        ...(role === "employer" && {
          positionHiringFor: formData.positionHiringFor,
          jobDescription: formData.jobDescription,
        }),
      });

      // STEP 5: Save files
      const filesRef = doc(db, "userFiles", user.uid);
      const filesData = {
        uploadedAt: new Date(),
      };

      if (photoBase64) {
        filesData.photoBase64 = photoBase64;
        filesData.photoName = formData.photoFile.name;
      }
      if (resumeBase64) {
        filesData.resumeBase64 = resumeBase64;
        filesData.resumeName = formData.resumeFile.name;
      }
      if (documentBase64) {
        filesData.documentBase64 = documentBase64;
        filesData.documentName = formData.documentFile.name;
      }

      await setDoc(filesRef, filesData);

      // STEP 6: Send Firebase verification email
      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email?uid=${user.uid}`,
        handleCodeInApp: false,
      };

      try {
        await sendEmailVerification(user, actionCodeSettings);
        console.log("Verification email sent to:", formData.email);
      } catch (emailErr) {
        console.error("Email verification error:", emailErr);
        setError("Failed to send verification email. Please try registering again.");
        setLoading(false);
        return;
      }

      // STEP 7: Send custom email (optional)
      const emailContent = generateEmailContent(registrationData, formData.email);
      
      try {
        await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            subject: '✅ Verify Your Email - Montalban Jobs',
            htmlContent: emailContent,
            registrationData: registrationData
          })
        });
      } catch (fetchErr) {
        console.warn('Custom email service unavailable:', fetchErr?.message || 'Unknown error');
        console.warn('Using Firebase verification email');
      }

      // STEP 8: Set registration complete state
      setRegistrationComplete(true);
      setLoading(false);

    } catch (err) {
      console.error("Registration error:", err);
      if (err?.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please use a different email or login.");
      } else if (err?.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (err?.code === "auth/invalid-email") {
        setError("Invalid email address. Please check and try again.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("Email/password authentication is not enabled. Please contact support.");
      } else {
        setError(err?.message || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const goToLogin = () => navigate("/login");

  const isPasswordValid = Object.values(passwordValidation).every(v => v === true);
  const passwordStrength = getPasswordStrength();

  return (
    <div className="register-page">
      <style>{`
        .register-wrapper {
          max-width: 980px;
          margin: 32px auto;
          padding: 20px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .step-indicator {
          min-width: 160px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }
        .steps {
          background: #fff;
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          width: 100%;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
        }
        .step .circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #fff;
          font-size: 14px;
        }
        .step-label { color: #444; font-size: 14px; font-weight:600; }
        .circle.inactive { background: #e6eef6; color: #2c3e50; box-shadow:none; }
        .circle.active { background: #0d6efd; box-shadow: 0 6px 18px rgba(13,110,253,0.18); transform: scale(1.06); transition: transform .18s; }
        .circle.done { background: #28a745; box-shadow: 0 6px 18px rgba(40,167,69,0.12); }
        .card {
          background: #fff;
          padding: 22px;
          border-radius: 12px;
          box-shadow: 0 10px 34px rgba(16,24,40,0.06);
          position: relative;
          overflow: hidden;
          min-width: 0;
        }
        .content-area { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .logo {
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom: 6px;
        }
        .brand {
          font-weight:700;
          font-size:18px;
          color:#0d6efd;
        }
        .back-wrapper { display:flex; justify-content:flex-start; padding-left:6px; }
        .back-login {
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:8px 14px;
          background: #ffffff;
          border: 1px solid #e8f1ff;
          color: #0d6efd;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight:600;
          box-shadow: 0 6px 18px rgba(13,110,253,0.06);
          transition: transform .12s, background .12s, box-shadow .12s;
        }
        .back-login:hover { transform: translateY(-2px); background:#f8fbff; box-shadow: 0 10px 28px rgba(13,110,253,0.08); }
        .back-login .icon { font-size: 14px; opacity:0.9; }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .form-grid .full { grid-column: 1 / -1; }
        input, select, textarea {
          width:100%;
          padding:12px 16px;
          border-radius:10px;
          border:1.5px solid #e9eef6;
          background:#fff;
          outline: none;
          transition: box-shadow .12s, transform .12s, border-color .12s;
          font-size: 14px;
          box-sizing: border-box;
          font-family: inherit;
        }
        input.invalid {
          border-color: #dc3545;
          background: #fff5f5;
        }
        input::placeholder { color: #adb5bd; }
        input:focus, select:focus, textarea:focus { 
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1); 
          transform: translateY(-2px); 
          border-color: #0d6efd;
        }
        input.invalid:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
          border-color: #dc3545;
        }
        
        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .controls {
          display:flex;
          gap:12px;
          justify-content: space-between;
          margin-top: 14px;
        }
        .btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: transform .12s ease, box-shadow .12s;
          font-weight:600;
        }
        .btn:active { transform: translateY(2px); }
        .btn-primary { background:#0d6efd; color:#fff; box-shadow: 0 8px 28px rgba(13,110,253,0.12); }
        .btn-primary:hover { transform: translateY(-3px); }
        .btn-secondary { background:#6c757d; color:#fff; }
        .btn-success { background:#28a745; color:#fff; }
        .role-choices { display:flex; gap:28px; align-items:center; flex-wrap:nowrap; padding:6px 4px; }
        .role-choices label {
          display:flex;
          align-items:center;
          gap:12px;
          padding:10px 12px;
          border-radius:10px;
          cursor:pointer;
          border:1px solid transparent;
          transition: background .12s, border-color .12s, box-shadow .12s;
          background: #fbfdff;
          min-width: 220px;
        }
        .role-choices input[type="radio"] { width:18px; height:18px; }
        .role-choices label:hover { background:#f2f8ff; border-color:#e6f0ff; box-shadow: 0 6px 18px rgba(13,110,253,0.04); }
        .error { color: #d9534f; margin-top: 8px; font-weight:600; font-size: 13px; }
        .step-title { text-align:center; margin-bottom: 16px; font-weight:700; color:#222; }
        .loading-overlay {
          position:absolute;
          inset:0;
          background: rgba(255,255,255,0.8);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index: 30;
          backdrop-filter: blur(3px);
        }
        .spinner {
          width:50px;
          height:50px;
          border-radius:50%;
          border:6px solid #eef5ff;
          border-top-color: #0d6efd;
          animation: spin 1s linear infinite;
          box-shadow: 0 8px 24px rgba(13,110,253,0.12);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
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
        .photo-preview {
          width: 100%;
          height: 150px;
          border-radius: 10px;
          object-fit: cover;
          margin-top: 8px;
          border: 1px solid #e9eef6;
        }
        .file-info {
          font-size: 12px;
          color: #28a745;
          margin-top: 6px;
          padding: 8px;
          background: #f0fdf4;
          border-radius: 6px;
        }

        .password-validation {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 13px;
        }
        .validation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .validation-item:last-child {
          margin-bottom: 0;
        }
        .validation-item.valid { color: #28a745; }
        .validation-item.invalid { color: #dc3545; }
        .validation-check {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .password-strength {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          text-align: center;
          font-weight: 600;
          font-size: 12px;
        }

        .contact-number-error {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .register-wrapper { padding: 16px; margin: 12px; flex-direction: column; }
          .step-indicator { flex-direction: row; justify-content: center; min-width: auto; }
          .steps { display:flex; gap:8px; padding:8px; margin-bottom: 6px; }
          .form-grid { grid-template-columns: 1fr; }
          .controls { flex-direction: column; }
          .btn { width: 100%; }
          .card { padding: 16px; }
          .role-choices { flex-direction: column; align-items: stretch; gap:10px; }
        }

        .waiting-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 32px 16px;
          text-align: center;
          min-height: 400px;
        }
        .waiting-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          animation: pulse-icon 2s ease-in-out infinite;
        }
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .waiting-title {
          font-size: 24px;
          font-weight: 700;
          color: #222;
          margin: 0;
        }
        .waiting-subtitle {
          font-size: 14px;
          color: #6c757d;
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }
        .email-badge {
          background: #f0f8ff;
          color: #0d6efd;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        .wait-info {
          background: #fffbf0;
          border-left: 4px solid #fd7e14;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          color: #856404;
          margin-top: 16px;
          text-align: left;
        }
        .btn-back-login {
          margin-top: 24px;
          padding: 10px 24px;
          background: #0d6efd;
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: transform .12s, box-shadow .12s;
        }
        .btn-back-login:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(13, 110, 253, 0.18);
        }

        .form-error-label {
          color: #dc3545;
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
          display: block;
        }

        input.error-input, select.error-input, textarea.error-input {
          border-color: #dc3545 !important;
          background: #fff5f5 !important;
        }

        input.error-input:focus, select.error-input:focus, textarea.error-input:focus {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }
      `}</style>

      {registrationComplete ? (
        <div className="register-wrapper">
          <div className="content-area">
            <main className="card" role="main">
              <div className="waiting-state">
                <div className="waiting-icon">✉️</div>
                <h2 className="waiting-title">Verification Email Sent!</h2>
                <p className="waiting-subtitle">
                  We've sent a verification link to your email address. Click the link in your email to verify and complete your registration.
                </p>
                <div className="email-badge">{formData.email}</div>
                
                <div className="wait-info">
                  <strong>📧 What happens next:</strong>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", textAlign: "left" }}>
                    <li>Check your inbox (and spam folder) for our email</li>
                    <li>Click the verification link in the email</li>
                    <li>Review your profile information</li>
                    <li>You'll be redirected to login</li>
                  </ul>
                </div>

                <p style={{ fontSize: "12px", color: "#6c757d", margin: "16px 0 0 0" }}>
                  The link expires in 24 hours
                </p>

                <button className="btn-back-login" onClick={goToLogin}>
                  ← Back to Login
                </button>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div className="register-wrapper">
          <aside className="step-indicator" aria-hidden>
            <div className="back-wrapper">
              <button className="back-login" type="button" onClick={goToLogin} aria-label="Back to login">
                <span className="icon">←</span>
                <span>Back to Login</span>
              </button>
            </div>
            <div className="steps" role="list">
              <div className="step" role="listitem">
                <div className={`circle ${currentStep === 1 ? "active" : (currentStep > 1 ? "done" : "inactive")}`}>
                  {currentStep > 1 ? "✓" : "1"}
                </div>
                <div className="step-label">Account</div>
              </div>
              <div className="step" role="listitem">
                <div className={`circle ${currentStep === 2 ? "active" : (currentStep < 2 ? "inactive" : "done")}`}>
                  {currentStep > 2 ? "✓" : "2"}
                </div>
                <div className="step-label">Profile</div>
              </div>
            </div>
          </aside>

          <div className="content-area">
            <main className="card" role="main" aria-live="polite">
              <div className="logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                  <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.5V12.5Z" fill="white"/>
                </svg>
                <div>
                  <div className="brand">Montalban Jobs</div>
                  <div style={{ fontSize: 12, color: "#6c757d" }}>Find work or hire talent</div>
                </div>
              </div>

              <h3 className="step-title">Step {currentStep} — {currentStep === 1 ? "Account Setup" : `Profile (${role === "job_seeker" ? "Job Seeker" : "Employer"})`}</h3>

              {loading && (
                <div className="loading-overlay" aria-hidden>
                  <div>
                    <div className="spinner" />
                    <div style={{ textAlign: "center", marginTop: 8, color: "#333" }}>Processing your registration...</div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div style={{ animation: "fadeIn .28s ease" }}>
                  <div style={{ marginBottom: 12, display: "grid", gap: 12 }}>
                    <label style={{ fontSize: 13, color: "#444" }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="yourname@gmail.com"
                    />
                  </div>

                  <div style={{ marginBottom: 12, display: "grid", gap: 12 }}>
                    <label style={{ fontSize: 13, color: "#444" }}>Password</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password (min 8 characters)"
                        style={{ paddingRight: "45px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "14px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          color: "#6c757d",
                          transition: "color .2s",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#0d6efd"}
                        onMouseLeave={(e) => e.target.style.color = "#6c757d"}
                      >
                        {showPassword ? "🔓" : "🔒"}
                      </button>
                    </div>

                    {/* Password Validation */}
                    {formData.password && (
                      <div className="password-validation">
                        <div className={`validation-item ${passwordValidation.length ? "valid" : "invalid"}`}>
                          <span className="validation-check">{passwordValidation.length ? "✓" : "✕"}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`validation-item ${passwordValidation.uppercase ? "valid" : "invalid"}`}>
                          <span className="validation-check">{passwordValidation.uppercase ? "✓" : "✕"}</span>
                          <span>At least 1 uppercase letter (A-Z)</span>
                        </div>
                        <div className={`validation-item ${passwordValidation.lowercase ? "valid" : "invalid"}`}>
                          <span className="validation-check">{passwordValidation.lowercase ? "✓" : "✕"}</span>
                          <span>At least 1 lowercase letter (a-z)</span>
                        </div>
                        <div className={`validation-item ${passwordValidation.number ? "valid" : "invalid"}`}>
                          <span className="validation-check">{passwordValidation.number ? "✓" : "✕"}</span>
                          <span>At least 1 numeric digit (0-9)</span>
                        </div>
                        <div className={`validation-item ${passwordValidation.special ? "valid" : "invalid"}`}>
                          <span className="validation-check">{passwordValidation.special ? "✓" : "✕"}</span>
                          <span>At least 1 special character (!@#$%^&*)</span>
                        </div>
                        <div className="password-strength" style={{ background: passwordStrength.color + "20", color: passwordStrength.color }}>
                          Strength: {passwordStrength.text}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 8 }}>Signing up as</label>
                    <div className="role-choices">
                      <label>
                        <input
                          type="radio"
                          name="role"
                          value="job_seeker"
                          checked={role === "job_seeker"}
                          onChange={(e) => setRole(e.target.value)}
                        />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 14, color: "#223" }}>Job Seeker</span>
                          <small style={{ color: "#6c757d", fontSize: 12 }}>Looking for work</small>
                        </div>
                      </label>

                      <label>
                        <input
                          type="radio"
                          name="role"
                          value="employer"
                          checked={role === "employer"}
                          onChange={(e) => setRole(e.target.value)}
                        />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 14, color: "#223" }}>Employer</span>
                          <small style={{ color: "#6c757d", fontSize: 12 }}>Hiring</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  {error && <div className="error">{error}</div>}

                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={handleNext}
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                      disabled={!isPasswordValid}
                      title={!isPasswordValid ? "Password must meet all requirements" : ""}
                      aria-label="Next"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div style={{ animation: "fadeIn .28s ease, slideIn .32s ease" }}>
                  {role === "job_seeker" && (
                    <div className="form-grid">
                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Full Name *</label>
                        <input 
                          name="fullName" 
                          value={formData.fullName} 
                          onChange={handleChange} 
                          placeholder="Enter your full name"
                          className={formErrors.fullName ? "error-input" : ""}
                        />
                        {formErrors.fullName && <span className="form-error-label">⚠️ {formErrors.fullName}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Age *</label>
                        <input 
                          type="number" 
                          name="age" 
                          value={formData.age} 
                          onChange={handleChange} 
                          placeholder="Enter your age"
                          className={formErrors.age ? "error-input" : ""}
                        />
                        {formErrors.age && <span className="form-error-label">⚠️ {formErrors.age}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Gender *</label>
                        <select 
                          name="gender" 
                          value={formData.gender} 
                          onChange={handleChange}
                          className={formErrors.gender ? "error-input" : ""}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        {formErrors.gender && <span className="form-error-label">⚠️ {formErrors.gender}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Barangay *</label>
                        <select 
                          name="barangay" 
                          value={formData.barangay} 
                          onChange={handleChange}
                          className={formErrors.barangay ? "error-input" : ""}
                        >
                          <option value="">Select Barangay</option>
                          {barangays.map((b) => (<option key={b} value={b}>{b}</option>))}
                        </select>
                        {formErrors.barangay && <span className="form-error-label">⚠️ {formErrors.barangay}</span>}
                      </div>

                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Address *</label>
                        <input 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange} 
                          placeholder="Enter your address"
                          className={formErrors.address ? "error-input" : ""}
                        />
                        {formErrors.address && <span className="form-error-label">⚠️ {formErrors.address}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Desired Job Title *</label>
                        <input 
                          name="desiredJob" 
                          value={formData.desiredJob} 
                          onChange={handleChange} 
                          placeholder="e.g., Software Developer"
                          className={formErrors.desiredJob ? "error-input" : ""}
                        />
                        {formErrors.desiredJob && <span className="form-error-label">⚠️ {formErrors.desiredJob}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Skills *</label>
                        <input 
                          name="skills" 
                          value={formData.skills} 
                          onChange={handleChange} 
                          placeholder="e.g., JavaScript, React, Node.js"
                          className={formErrors.skills ? "error-input" : ""}
                        />
                        {formErrors.skills && <span className="form-error-label">⚠️ {formErrors.skills}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Years Experience *</label>
                        <input 
                          type="number" 
                          name="experience" 
                          value={formData.experience} 
                          onChange={handleChange} 
                          placeholder="e.g., 3"
                          className={formErrors.experience ? "error-input" : ""}
                        />
                        {formErrors.experience && <span className="form-error-label">⚠️ {formErrors.experience}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Education Level *</label>
                        <select 
                          name="education" 
                          value={formData.education} 
                          onChange={handleChange}
                          className={formErrors.education ? "error-input" : ""}
                        >
                          <option value="">Select Education</option>
                          {educationOptions.map((ed) => (<option key={ed} value={ed}>{ed}</option>))}
                        </select>
                        {formErrors.education && <span className="form-error-label">⚠️ {formErrors.education}</span>}
                      </div>

                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Contact Number *</label>
                        <input 
                          name="contactNumber" 
                          value={formData.contactNumber} 
                          onChange={handleChange}
                          placeholder="9665235745"
                          type="tel"
                          maxLength="10"
                          className={formErrors.contactNumber || contactNumberError ? "error-input" : ""}
                        />
                        <small style={{ color: "#6c757d", fontSize: 11 }}>Format: 10 digits starting with 9 (e.g., 9665235745) → stored as +639665235745</small>
                        {(contactNumberError || formErrors.contactNumber) && <div className="form-error-label">⚠️ {contactNumberError || formErrors.contactNumber}</div>}
                      </div>

                      {/* Profile Photo Upload */}
                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 8 }}>Profile Photo *</label>
                        <div className={`upload-box ${formErrors.photoFile ? "error-input" : ""}`} style={{ borderColor: formErrors.photoFile ? "#dc3545" : "#0d6efd", background: formErrors.photoFile ? "#fff5f5" : "#f8fbff" }}>
                          <input 
                            type="file" 
                            id="photoInput"
                            accept="image/*"
                            onChange={handlePhotoChange}
                          />
                          <label htmlFor="photoInput" className="upload-label">
                            Click to upload photo
                          </label>
                          <div className="upload-sublabel">JPG, JPEG, PNG • Max 5MB</div>
                          {photoPreview && <img src={photoPreview} alt="Preview" className="photo-preview" />}
                          {formData.photoFile && <div className="file-info">✓ {formData.photoFile.name} ({(formData.photoFile.size / 1024).toFixed(2)} KB)</div>}
                        </div>
                        {formErrors.photoFile && <span className="form-error-label">⚠️ {formErrors.photoFile}</span>}
                      </div>

                      {/* Resume Upload */}
                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 8 }}>Resume *</label>
                        <div className={`upload-box ${formErrors.resumeFile ? "error-input" : ""}`} style={{ borderColor: formErrors.resumeFile ? "#dc3545" : "#0d6efd", background: formErrors.resumeFile ? "#fff5f5" : "#f8fbff" }}>
                          <input 
                            type="file" 
                            id="resumeInput"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeChange}
                          />
                          <label htmlFor="resumeInput" className="upload-label">
                            Click to upload resume
                          </label>
                          <div className="upload-sublabel">PDF, DOC, DOCX • Max 5MB</div>
                          {resumeName && <div className="file-info">✓ {resumeName} ({(formData.resumeFile?.size / 1024).toFixed(2)} KB)</div>}
                        </div>
                        {formErrors.resumeFile && <span className="form-error-label">⚠️ {formErrors.resumeFile}</span>}
                      </div>
                    </div>
                  )}

                  {role === "employer" && (
                    <div className="form-grid">
                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Company Name *</label>
                        <input 
                          name="companyName" 
                          value={formData.companyName} 
                          onChange={handleChange} 
                          placeholder="Enter company name"
                          className={formErrors.companyName ? "error-input" : ""}
                        />
                        {formErrors.companyName && <span className="form-error-label">⚠️ {formErrors.companyName}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Barangay *</label>
                        <select 
                          name="barangay" 
                          value={formData.barangay} 
                          onChange={handleChange}
                          className={formErrors.barangay ? "error-input" : ""}
                        >
                          <option value="">Select Barangay</option>
                          {barangays.map((b) => (<option key={b} value={b}>{b}</option>))}
                        </select>
                        {formErrors.barangay && <span className="form-error-label">⚠️ {formErrors.barangay}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Address *</label>
                        <input 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange} 
                          placeholder="Enter company address"
                          className={formErrors.address ? "error-input" : ""}
                        />
                        {formErrors.address && <span className="form-error-label">⚠️ {formErrors.address}</span>}
                      </div>

                      <div>
                        <label style={{ fontSize: 13, color: "#444" }}>Contact Person *</label>
                        <input 
                          name="contactPerson" 
                          value={formData.contactPerson} 
                          onChange={handleChange} 
                          placeholder="Enter contact person name"
                          className={formErrors.contactPerson ? "error-input" : ""}
                        />
                        {formErrors.contactPerson && <span className="form-error-label">⚠️ {formErrors.contactPerson}</span>}
                      </div>

                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Contact Number *</label>
                        <input 
                          name="contactNumber" 
                          value={formData.contactNumber} 
                          onChange={handleChange}
                          placeholder="9665235745"
                          type="tel"
                          maxLength="10"
                          className={formErrors.contactNumber || contactNumberError ? "error-input" : ""}
                        />
                        <small style={{ color: "#6c757d", fontSize: 11 }}>Format: 10 digits starting with 9 (e.g., 9665235745) → stored as +639665235745</small>
                        {(contactNumberError || formErrors.contactNumber) && <div className="form-error-label">⚠️ {contactNumberError || formErrors.contactNumber}</div>}
                      </div>

                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Position Hiring For *</label>
                        <input 
                          name="positionHiringFor" 
                          value={formData.positionHiringFor} 
                          onChange={handleChange} 
                          placeholder="e.g., Senior Developer"
                          className={formErrors.positionHiringFor ? "error-input" : ""}
                        />
                        {formErrors.positionHiringFor && <span className="form-error-label">⚠️ {formErrors.positionHiringFor}</span>}
                      </div>

                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444" }}>Job Description *</label>
                        <textarea 
                          name="jobDescription" 
                          value={formData.jobDescription} 
                          onChange={handleChange} 
                          rows={4} 
                          placeholder="Describe the job responsibilities..."
                          className={formErrors.jobDescription ? "error-input" : ""}
                        />
                        {formErrors.jobDescription && <span className="form-error-label">⚠️ {formErrors.jobDescription}</span>}
                      </div>

                      {/* Business Document Upload for Employer */}
                      <div className="full">
                        <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 8 }}>Business Document *</label>
                        <div className={`upload-box ${formErrors.documentFile ? "error-input" : ""}`} style={{ borderColor: formErrors.documentFile ? "#dc3545" : "#0d6efd", background: formErrors.documentFile ? "#fff5f5" : "#f8fbff" }}>
                          <input 
                            type="file" 
                            id="documentInput"
                            accept=".pdf,.doc,.docx"
                            onChange={handleDocumentChange}
                          />
                          <label htmlFor="documentInput" className="upload-label">
                            Click to upload document
                          </label>
                          <div className="upload-sublabel">PDF, DOC, DOCX • Max 5MB</div>
                          {documentName && <div className="file-info">✓ {documentName} ({(formData.documentFile?.size / 1024).toFixed(2)} KB)</div>}
                        </div>
                        {formErrors.documentFile && <span className="form-error-label">⚠️ {formErrors.documentFile}</span>}
                      </div>
                    </div>
                  )}

                  {/* Terms & Conditions Checkbox */}
                  <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#fff", borderRadius: "10px", border: "none" }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", fontSize: "13px", color: "#444" }}>
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        style={{ marginTop: "2px", width: "18px", height: "18px", cursor: "pointer", minWidth: "18px" }}
                        aria-label="Agree to Terms and Conditions"
                      />
                      <span>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0d6efd",
                            textDecoration: "underline",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#0b5ed7")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#0d6efd")}
                        >
                          Terms & Conditions
                        </button>
                        {" "}and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0d6efd",
                            textDecoration: "underline",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#0b5ed7")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#0d6efd")}
                        >
                          Privacy Policy
                        </button>
                        *
                      </span>
                    </label>
                  </div>

                  {error && <div className="error">{error}</div>}

                  <div className="controls">
                    <button onClick={handleBack} className="btn btn-secondary">← Back</button>
                    <button 
                      onClick={handleRegister} 
                      className="btn btn-success" 
                      disabled={loading || !agreedToTerms}
                      title={!agreedToTerms ? "Please agree to Terms & Conditions and Privacy Policy" : ""}
                    >
                      {loading ? "Processing..." : "Register & Send Email"}
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </div>
  );
};

export default Register;

function generateEmailContent(registrationData, email) {
  const { role, profile } = registrationData;
  const isJobSeeker = role === "job_seeker";

  let profileDetailsHTML = "";

  if (isJobSeeker) {
    profileDetailsHTML = `
      <tr>
        <td colspan="2" style="padding: 16px 0; border-top: 1px solid #e9ecef;">
          <h3 style="margin: 0 0 12px 0; color: #0d6efd; font-size: 14px;">👤 Your Profile</h3>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Full Name:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.fullName || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Age:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.age || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Gender:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.gender || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Location:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.barangay || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Address:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.address || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Desired Job:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.desiredJob || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Skills:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.skills || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Experience:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.experience || "N/A"} years</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Education:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.education || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Contact Number:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.contactNumber || "N/A"}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 12px 0; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            📁 Files: ${profile.photoName ? "✓ Photo " : ""} ${profile.resumeName ? "✓ Resume" : ""}
          </p>
        </td>
      </tr>
    `;
  } else {
    profileDetailsHTML = `
      <tr>
        <td colspan="2" style="padding: 16px 0; border-top: 1px solid #e9ecef;">
          <h3 style="margin: 0 0 12px 0; color: #0d6efd; font-size: 14px;">🏢 Company Profile</h3>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Company Name:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.companyName || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Contact Person:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.contactPerson || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Location:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.barangay || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Address:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.address || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Contact Number:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.contactNumber || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Position Hiring:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.positionHiringFor || "N/A"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;">Job Description:</td>
        <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${profile.jobDescription || "N/A"}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 12px 0; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            📁 Business Document: ${profile.documentName ? "✓ Uploaded" : ""}
          </p>
        </td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
          .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
          .logo-text { font-weight: 700; font-size: 18px; color: #0d6efd; }
          .header { margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 700; color: #222; margin: 0 0 8px 0; }
          .subtitle { font-size: 14px; color: #6c757d; margin: 0; }
          .button { display: inline-block; background: #0d6efd; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0; }
          .button:hover { background: #0b5ed7; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .divider { border-top: 2px solid #e9ecef; margin: 24px 0; }
          .footer { text-align: center; font-size: 12px; color: #6c757d; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <!-- Logo -->
            <div class="logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.5V12.5Z" fill="white"/>
              </svg>
              <div class="logo-text">Montalban Jobs</div>
            </div>

            <!-- Header -->
            <div class="header">
              <h1 class="title">✅ Verify Your Email</h1>
              <p class="subtitle">Thank you for registering! Please verify your email address by clicking the verification link we sent to your inbox.</p>
            </div>

            <!-- Registration Summary -->
            <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #222;">📋 Your Registration Info</h2>
            <table>
              <tr>
                <td style="padding: 8px 0; color: #555;">Email:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #555;">Account Type:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #222; text-align: right;">${role === "job_seeker" ? "👤 Job Seeker" : "🏢 Employer"}</td>
              </tr>
              ${profileDetailsHTML}
            </table>

            <div class="divider"></div>

            <!-- Verification Button -->
            <p style="text-align: center; margin: 24px 0 16px 0; color: #555;">Click the button below or check your email for the verification link:</p>
            <div style="text-align: center;">
              <a href="${window.location.origin}/verify-email" class="button">✓ Verify Email Address</a>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 8px 0;">⏰ The verification link will expire in 24 hours.</p>
              <p style="margin: 0;">If you did not create this account, please ignore this email.</p>
              <p style="margin: 12px 0 0 0; color: #adb5bd;">© 2025 Montalban Jobs. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

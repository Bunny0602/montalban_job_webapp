import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import Sidebar from "./Sidebar";
import EmployerProfile from "./EmployerProfile";
import PostJob from "./PostJob";
import Overview from "./Overview";
import ApplicationList from "./ApplicationList"; 

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state;
  const [active, setActive] = useState("Dashboard");
  const [editingJobId, setEditingJobId] = useState(null);

  if (!userData) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const { profile, email } = userData;

  const renderContent = () => {
    console.log("Current active:", active);
    
    switch (active) {
      case "Profile":
        return <EmployerProfile profile={profile} />;
      case "Dashboard":
        return <Overview setActive={setActive} setEditingJobId={setEditingJobId} />;
      case "Post Job":
        return <PostJob jobId={editingJobId} />;
      case "Applications":
      case "Applicants":
        return <ApplicationList />;
      default:
        return null;
    }
  };

  return (
    <div className="employer-dashboard-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body, html {
          overflow: hidden;
        }

        .employer-dashboard-container {
          display: flex;
          width: 100%;
          height: 100vh;
          background: #f8fafc;
          overflow: hidden;
        }

        .employer-dashboard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          margin-left: 220px;
          transition: margin-left 0.22s ease;
        }

        .employer-dashboard-content.sidebar-collapsed {
          margin-left: 76px;
        }

        .employer-dashboard-header {
          background: linear-gradient(135deg, #ffffff 0%, #fbfdff 100%);
          border-bottom: 1.5px solid #eef4fb;
          padding: 20px 24px;
          box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
          flex-shrink: 0;
          z-index: 30;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .welcome-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .welcome-text {
          font-size: 18px;
          font-weight: 800;
          color: #12263b;
          margin: 0;
        }

        .welcome-subtitle {
          font-size: 13px;
          color: #6c757d;
          font-weight: 500;
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #e9f4ff, #f7fbff);
          padding: 10px 16px;
          border-radius: 999px;
          border: 1.5px solid #e6f0ff;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.04);
          margin-left: auto;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.14);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1;
        }

        .user-name {
          font-size: 13px;
          color: #12263b;
          font-weight: 700;
        }

        .user-email {
          font-size: 11px;
          color: #6c757d;
          font-weight: 500;
        }

        .employer-dashboard-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
        }

        /* Coming Soon State */
        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          color: #6c757d;
        }

        .coming-soon-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .coming-soon h3 {
          font-size: 20px;
          font-weight: 800;
          color: #12263b;
          margin-bottom: 8px;
        }

        .coming-soon p {
          font-size: 14px;
          color: #6c757d;
          margin: 0;
        }

        /* Custom scrollbar */
        .employer-dashboard-main::-webkit-scrollbar {
          width: 8px;
        }

        .employer-dashboard-main::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }

        .employer-dashboard-main::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #d4dce8, #c5cfd8);
          border-radius: 4px;
          transition: background 0.14s ease;
        }

        .employer-dashboard-main::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #b5c2d6, #a6b3c4);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .employer-dashboard-content {
            margin-left: 0;
          }

          .employer-dashboard-content.sidebar-collapsed {
            margin-left: 0;
          }

          .employer-dashboard-header {
            padding: 16px 18px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-left {
            width: 100%;
            flex-direction: column;
            gap: 12px;
          }

          .welcome-text {
            font-size: 16px;
          }

          .user-badge {
            width: 100%;
            justify-content: center;
            margin-left: 0;
          }

          .employer-dashboard-main {
            padding: 16px;
          }
        }

        @media (max-width: 600px) {
          .employer-dashboard-header {
            padding: 14px 16px;
          }

          .header-content {
            gap: 10px;
          }

          .header-left {
            gap: 10px;
            width: 100%;
          }

          .welcome-section {
            gap: 4px;
          }

          .welcome-text {
            font-size: 14px;
          }

          .welcome-subtitle {
            font-size: 12px;
          }

          .user-badge {
            width: 100%;
            padding: 8px 12px;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .user-name {
            font-size: 12px;
          }

          .user-email {
            font-size: 10px;
          }

          .employer-dashboard-main {
            padding: 12px;
          }
        }
      `}</style>

      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

      <div className="employer-dashboard-content">
        <div className="employer-dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <div className="welcome-section">
                <h1 className="welcome-text">Welcome back! 👋</h1>
                <span className="welcome-subtitle">
                  Manage your job postings and candidates
                </span>
              </div>
              <div className="user-badge">
                <div className="user-avatar">
                  {email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {profile?.companyName || "Employer"}
                  </span>
                  <span className="user-email">{email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="employer-dashboard-main">
          <div className="content-wrapper">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import Sidebar from "./Sidebar";
import Overview from "./Overview";
import JobHistory from "./JobHistory";
import UserManagement from "./UserManagement"; 

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state;
  const [active, setActive] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      console.log("No user data found, redirecting to login...");
      navigate("/login");
    } else {
      setIsLoading(false);
    }
  }, [userData, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading || !userData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #eee',
            borderTop: '4px solid #0d6efd',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Loading admin dashboard...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const { profile, email } = userData;

  const renderContent = () => {
    switch (active) {
      case "Dashboard":
        return <Overview />;
      case "Job History":  
        return <JobHistory />;
      case "User Management":
        return <UserManagement />; 
      case "Jobs":
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#12263b', marginBottom: '16px' }}>Jobs Management</h2>
            <p style={{ color: '#6c757d' }}>Jobs management content coming soon...</p>
          </div>
        );
      case "Applications":
        return (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#12263b', marginBottom: '16px' }}>Applications</h2>
            <p style={{ color: '#6c757d' }}>Applications content coming soon...</p>
          </div>
        );
      default:
        return <Overview />; 
    }
  };

  return (
    <div className="admin-dashboard-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body, html {
          overflow: hidden;
        }

        .admin-dashboard-container {
          display: flex;
          width: 100%;
          height: 100vh;
          background: #f8fafc;
          overflow: hidden;
        }

        .admin-dashboard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          margin-left: 220px;
          transition: margin-left 0.22s ease;
        }

        .admin-dashboard-content.sidebar-collapsed {
          margin-left: 76px;
        }

        .admin-dashboard-header {
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

        .admin-dashboard-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .content-wrapper {
          width: 100%;
          flex: 1;
        }

        .admin-dashboard-main::-webkit-scrollbar {
          width: 8px;
        }

        .admin-dashboard-main::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }

        .admin-dashboard-main::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #d4dce8, #c5cfd8);
          border-radius: 4px;
          transition: background 0.14s ease;
        }

        .admin-dashboard-main::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #b5c2d6, #a6b3c4);
        }

        @media (max-width: 900px) {
          .admin-dashboard-content {
            margin-left: 0;
          }

          .admin-dashboard-content.sidebar-collapsed {
            margin-left: 0;
          }

          .admin-dashboard-header {
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

          .welcome-subtitle {
            font-size: 12px;
          }

          .user-badge {
            width: 100%;
            justify-content: center;
            margin-left: 0;
          }
        }

        @media (max-width: 600px) {
          .admin-dashboard-header {
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
            font-size: 11px;
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
        }
      `}</style>

      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />
      
      <div className="admin-dashboard-content">
        <div className="admin-dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <div className="welcome-section">
                <h1 className="welcome-text">Welcome Admin! 👋</h1>
                <span className="welcome-subtitle">Manage users, jobs, and applications</span>
              </div>
              <div className="user-badge">
                <div className="user-avatar">{email?.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <span className="user-name">{profile?.fullName || "Admin"}</span>
                  <span className="user-email">{email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-main">
          <div className="content-wrapper">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
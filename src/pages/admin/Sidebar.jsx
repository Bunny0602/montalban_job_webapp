import React, { useState, useEffect } from "react";

const Sidebar = ({ active, setActive, onLogout }) => {
  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "Job History", label: "Job Records", icon: "jobHistory" },
    { id: "User Management", label: "User Management", icon: "users" },
  ];

  // removed collapsed/manualToggle state per request
  const [isMobile, setIsMobile] = useState(false);

  // control mobile sidebar visibility
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const main = document.querySelector(".main-content");
    if (!main) return;

    // sidebar always full width on desktop (220px); on mobile main is full width
    const sidebarPx = isMobile ? 0 : 220;

    if (isMobile) {
      main.style.marginLeft = "0";
      main.style.maxWidth = "";
    } else {
      main.style.marginLeft = `${sidebarPx}px`;
      main.style.maxWidth = `calc(100% - ${sidebarPx}px)`;
    }

    main.style.transition = "margin-left 0.22s ease, max-width 0.22s ease";
    main.style.boxSizing = "border-box";

    return () => {
      if (main) {
        main.style.marginLeft = "";
        main.style.maxWidth = "";
        main.style.transition = "";
        main.style.boxSizing = "";
      }
    };
  }, [isMobile]);

  // lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const Icon = ({ name, size = 18 }) => {
    const common = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    };
    switch (name) {
      case "dashboard":
        return (
          <svg {...common} aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        );
      case "jobHistory":
        return (
          <svg {...common} aria-hidden>
            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "users":
        return (
          <svg {...common} aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Hamburger: show only on mobile when sidebar is closed */}
      <button
        className="mobile-toggle"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        style={{ display: isMobile && !mobileOpen ? undefined : "none" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Backdrop when mobile sidebar open */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`admin-sidebar ${isMobile && mobileOpen ? "mobile-open" : ""}`}
        aria-label="Admin navigation"
      >
        <style>{`
        .admin-sidebar {
          width: 220px;
          height: 100vh;
          background: linear-gradient(180deg,#ffffff 0%, #fbfdff 100%);
          border-right: 1px solid #eef4fb;
          padding: 18px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          transition: width .22s ease, transform .22s ease;
          position: fixed;
          left: 0;
          top: 0;
          overflow: hidden;
          z-index: 50;
          color: #1f2d3d;
        }

        .top { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          flex-shrink: 0; 
          border-bottom: 1px solid #eef4fb;
          padding-bottom: 12px;
        }
        .brand { display:flex; gap:12px; align-items:center; }
        .logo {
          width:44px; height:44px; border-radius:10px;
          background:linear-gradient(135deg,#e9f4ff,#f7fbff);
          display:flex; align-items:center; justify-content:center;
          color:#0d6efd; font-weight:800; font-size:16px;
          box-shadow: 0 8px 24px rgba(13,110,253,0.04);
          flex-shrink: 0;
        }
        .brand-text { display:flex; flex-direction:column; line-height:1; }
        .brand-title { font-weight:800; color:#0d6efd; font-size:14px; }
        .brand-sub { font-size:12px; color:#6c757d; margin-top:2px; }

        .nav { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; flex: 0 0 auto; }
        .nav-item {
          display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px;
          cursor:pointer; color:#1f2d3d; font-weight:700; background:transparent; border:1px solid transparent;
          transition: transform .12s, box-shadow .12s, background .12s;
        }
        .nav-item:hover { background:#f2f8ff; transform: translateY(-2px); }
        .nav-item.active {
          background: linear-gradient(90deg,#e9f4ff,#f7fbff);
          box-shadow: 0 10px 28px rgba(13,110,253,0.08);
          border-left: 4px solid #0d6efd;
        }

        .nav .icon {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          color: #0d6efd;
          min-width: 20px;
        }
        .nav-item.active .icon { color: #0a58ca; }

        .nav .icon svg { width: 18px; height: 18px; display:block; color: inherit; stroke: currentColor; fill: none; }

        .bottom { margin-top: auto; display:flex; flex-direction:column; gap:10px; }
        .logout {
          display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
          background:#fff5f6; color:#c82333; border:1px solid #fde7ea; cursor:pointer; font-weight:700;
          transition: all .12s ease;
        }
        .logout:hover { transform: translateY(-2px); background:#ffe9eb; }

        .help {
          font-size: 12px;
          color: #6c757d;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* MOBILE: <= 768px behavior */
        @media (max-width:768px) {
          .admin-sidebar {
            position: fixed;
            z-index: 100;
            width: 220px;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 8px 0 24px rgba(16,24,40,0.06);
            transition: transform .26s cubic-bezier(.2,.9,.2,1), width .22s ease;
          }

          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }

          /* mobile hamburger button (top-left) */
          .mobile-toggle {
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 110;
            background: white;
            border: 1px solid #eef4fb;
            padding: 8px 10px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #1f2d3d;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(13,110,253,0.04);
          }

          /* close button inside mobile sidebar */
          .mobile-close {
            margin-left: auto;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            color: #0d6efd;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          /* backdrop to dim content when sidebar is open */
          .sidebar-backdrop {
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(0,0,0,0.24);
            backdrop-filter: none;
          }
        }

        /* keep desktop styles intact */
        @media (min-width:769px) {
          .mobile-toggle { display: none; }
        }
      `}</style>

        <div className="top">
          <div className="brand">
            <div className="logo">A</div>
            <div className="brand-text">
              <div className="brand-title">Admin</div>
              <div className="brand-sub">Dashboard</div>
            </div>
          </div>

          {/* close button: only visible on mobile when sidebar is open */}
          {isMobile && mobileOpen && (
            <button
              className="mobile-close"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              style={{ display: isMobile && mobileOpen ? undefined : "none" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <nav className="nav">
          {menuItems.map((m) => {
            const isActive = active === m.id;
            return (
              <div
                key={m.id}
                onClick={() => {
                  setActive(m.id);
                  // on mobile, close sidebar after navigation and reveal hamburger
                  if (isMobile) setMobileOpen(false);
                }}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="icon"><Icon name={m.icon} /></span>
                <span className="label">{m.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="bottom">
          <button className="logout" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Logout</span>
          </button>
          <div className="help"></div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
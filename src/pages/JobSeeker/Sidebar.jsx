import React, { useState, useEffect } from "react";

const Sidebar = ({ active, setActive, onLogout }) => {
  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "Profile", label: "Profile", icon: "user" },
    { id: "MyApplications", label: "My Applications", icon: "briefcase" },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [manualToggle, setManualToggle] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!manualToggle) {
      Promise.resolve().then(() => {
        setCollapsed(isMobile);
      });
    }
  }, [isMobile, manualToggle]);

  // Adjust the content margin so it never overlaps the sidebar
  useEffect(() => {
    const main = document.querySelector(".main-content");
    if (!main) return;

    // compute sidebar width in px depending on collapsed / mobile state
    const sidebarPx = isMobile ? 0 : (collapsed ? 76 : 220);

    if (isMobile) {
      // mobile: sidebar overlays content, don't push — allow full width
      main.style.marginLeft = "0";
      main.style.maxWidth = "";
    } else {
      // desktop: push content and constrain max width so it won't slip under sidebar
      main.style.marginLeft = `${sidebarPx}px`;
      main.style.maxWidth = `calc(100% - ${sidebarPx}px)`;
    }

    // smooth transition and safe box sizing
    main.style.transition = "margin-left 0.22s ease, max-width 0.22s ease";
    main.style.boxSizing = "border-box";

    // cleanup: restore styles when component unmounts
    return () => {
      if (main) {
        main.style.marginLeft = "";
        main.style.maxWidth = "";
        main.style.transition = "";
        main.style.boxSizing = "";
      }
    };
  }, [collapsed, isMobile]);

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
      case "user":
        return (
          <svg {...common} aria-hidden>
            <path d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12z" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        );
      case "briefcase":
        return (
          <svg {...common} aria-hidden>
            <rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={`jobseeker-sidebar ${collapsed ? "collapsed" : ""}`} aria-label="Job seeker navigation">
      <style>{`
        .jobseeker-sidebar {
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
          color: #1f2d3d; /* base text color */
        }
        .jobseeker-sidebar.collapsed { width: 76px; }

        /* hide brand text when collapsed */
        .jobseeker-sidebar.collapsed .brand-text { display: none; }

        .top { 
          display: flex; 
          lign-items: center; 
          gap: 12px; 
          flex-shrink: 0; 
          border-bottom: 1px solid #eef4fb;
          padding-bottom: 12px;
        }
        .brand { display:flex; gap:12px; align-items:center; }
        .logo {
          width:44px; height:44px; border-radius:10px;
          background:linear-gradient(135deg,#eaf7ef,#f7fbff);
          display:flex; align-items:center; justify-content:center;
          color:#0d6efd; font-weight:800; font-size:16px;
          box-shadow: 0 8px 24px rgba(13,110,253,0.04);
          flex-shrink: 0;
        }
        .brand-text { display:flex; flex-direction:column; line-height:1; }
        .brand-title { font-weight:800; color:#0d6efd; font-size:14px; }
        .brand-sub { font-size:12px; color:#6c757d; margin-top:2px; }

        .toggle-btn {
          margin-left:auto; background:transparent; border:none; cursor:pointer;
          padding:6px; border-radius:8px; color:#0d6efd;
          display:inline-flex; align-items:center; justify-content:center;
          transition: transform .14s ease;
        }
        .toggle-btn .chev { transition: transform .18s ease; }
        .toggle-btn[aria-pressed="true"] .chev { transform: rotate(180deg); }

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
        .nav-item.collapsed { justify-content:center; padding-left:6px; padding-right:6px; }
        .nav-item.collapsed .label { display:none; }

        /* icons: use currentColor so SVG strokes/fills follow .icon color */
        .nav .icon {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          color: #0d6efd; /* default icon color (match previous) */
          min-width: 20px;
        }
        .nav-item.active .icon { color: #0a58ca; } /* active icon color */
        .nav-item.collapsed .icon { margin: 0; }

        /* ensure SVGs scale and inherit color/stroke */
        .nav .icon svg { width: 18px; height: 18px; display:block; color: inherit; stroke: currentColor; fill: none; }

        .bottom { margin-top: auto; display:flex; flex-direction:column; gap:10px; }
        .logout {
          display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
          background:#fff5f6; color:#c82333; border:1px solid #fde7ea; cursor:pointer; font-weight:700;
          transition: all .12s ease;
        }
        .logout:hover { transform: translateY(-2px); background:#ffe9eb; }

        /* help / contact text */
        .help {
          font-size: 12px;
          color: #6c757d;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* MOBILE: sidebar overlays content (do NOT force .main-content) */
        @media (max-width:900px) {
          .jobseeker-sidebar {
            position: fixed;
            z-index: 100;
            width: 220px;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(0);
            box-shadow: 8px 0 24px rgba(16,24,40,0.06);
          }
          /* Leave main-content styling to layout code / JS so it can decide whether to push or overlay */
        }
      `}</style>

      <div className="top">
        <div className="brand">
          <div className="logo">JS</div>
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-title">Job Seeker</div>
              <div className="brand-sub">Dashboard</div>
            </div>
          )}
        </div>

        <button
          className="toggle-btn"
          title={collapsed ? "Expand" : "Collapse"}
          aria-pressed={collapsed}
          onClick={() => {
            setCollapsed((s) => !s);
            setManualToggle(true);
          }}
        >
          <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <nav className="nav">
        {menuItems.map((m) => {
          const isActive = active === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`nav-item ${isActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
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
          {!collapsed && <span>Logout</span>}
        </button>
        {!collapsed && <div className="help">Bunny</div>}
      </div>
    </aside>
  );
};

export default Sidebar;

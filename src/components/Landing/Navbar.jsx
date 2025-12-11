import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const [, setActiveSection] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* -----------------------------
        CLOSE ON ESCAPE OR CLICK OUTSIDE
  ------------------------------*/
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDocClick(e) {
      if (!open) return;
      const panel = panelRef.current;
      const btn = btnRef.current;
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [open]);

  /* -----------------------------
        LOCK SCROLL WHEN MENU OPEN
  ------------------------------*/
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* -----------------------------
        ACTIVATE NAV LINKS WHILE SCROLLING
  ------------------------------*/
  useEffect(() => {
    const ids = [
      { id: "hero-heading", name: "home" },
      { id: "jobs-title", name: "jobs" },
      { id: "about-title", name: "about" }
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const found = ids.find((f) => f.id === entry.target.id);
            if (found) setActiveSection(found.name);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );

    ids.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* -----------------------------
        CROSS-ROUTE SMOOTH SCROLL HELPERS
  ------------------------------*/
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      scrollToId("hero-heading");
    }
    setOpen(false);
  };

  const handleJobsClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      scrollToId("jobs-title");
    } else {
      e.preventDefault();
      navigate("/");
      setTimeout(() => scrollToId("jobs-title"), 200);
    }
    setOpen(false);
  };

  const handleAboutClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      scrollToId("about-title");
    } else {
      e.preventDefault();
      navigate("/");
      setTimeout(() => scrollToId("about-title"), 200);
    }
    setOpen(false);
  };

  /* -----------------------------
              CSS FIXED
  ------------------------------*/
  return (
    <header className="mp-nav" role="banner">
      <style>{`
        .mp-nav {
          position: sticky;
          top: 0;
          z-index: 1200;
          background: #fff;
          box-shadow: 0 2px 10px rgba(2,6,23,0.06);
        }
        .mp-nav-inner {
          max-width: 1200px;
          margin: auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          min-height: 56px; /* Ensure consistent height for mobile panel top */
          position: relative;
        }
        .mp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .mp-logo-text {
          font-weight: 800;
          color: #0055ff;
        }

        /* Desktop links */
        /* Center the links visually in the nav */
        .mp-links {
          display: flex;
          gap: 20px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          align-items: center;
          pointer-events: auto;
        }
        .mp-link {
          padding: 8px;
          border-radius: 8px;
          color: #334155;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .mp-link:hover {
          background: rgba(0,85,255,0.06);
        }
        /* Removed prominent active background to simplify header visuals */
        .mp-link.active {
          color: #0055ff;
          font-weight: 600;
        }

        .mp-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-left: auto; /* push actions to the right */
        }
        .mp-login {
          color: #0055ff;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .mp-login:hover {
          color: #0033cc;
        }
        .mp-register {
          background: #0055ff;
          color: #fff;
          padding: 8px 12px;
          border: 0;
          border-radius: 8px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .mp-register:hover {
          background: #0033cc;
        }

        /* BURGER - Improved UI: Added hover/open background, smoother transitions, and better colors */
        .mp-hamburger {
          display: none;
          width: 44px;
          height: 44px;
          background: #fff;
          border: 1px solid rgba(2,6,23,0.06);
          padding: 8px;
          border-radius: 10px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
          /* place at right edge of nav-inner so it doesn't overlap the logo */
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1350;
        }
        .mp-hamburger:hover,
        .mp-hamburger.open {
          background: rgba(0,85,255,0.06);
          box-shadow: 0 4px 12px rgba(2,6,23,0.08);
        }
        .bar {
          display:none; /* no inline bars — using SVG for consistent appearance */
        }
        /* Keep the burger as three simple stacked lines (no X transform)
           The button still changes background on hover/open for affordance. */

        /* MOBILE NAV - Improved UI: Added overlay, better padding, styled links with hover/active states */
        /* Hide mobile panel on desktop to prevent duplicate link rendering */
        .mp-mobile-panel {
          display: none;
        }

        @media (max-width: 768px) {
          .mp-mobile-panel {
            display: block;
          }
          .mp-links,
          .mp-actions {
            display: none;
          }
          /* ensure hamburger sits above link area on small screens */
          .mp-hamburger {
            display: flex;
          }
          .mp-hamburger {
            display: flex;
          }

          .mp-mobile-panel {
            position: fixed;
            top: 56px; /* Matches min-height of .mp-nav-inner */
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.98); /* Slight transparency for overlay effect */
            backdrop-filter: blur(4px); /* Modern blur effect */
            opacity: 0;
            max-height: 0;
            pointer-events: none;
            transform: translateY(-10px);
            transition: all 0.3s ease; /* Smoother slide */
            padding: 18px 16px; /* More compact padding for better spacing */
            box-shadow: inset 0 1px 0 rgba(0,0,0,0.1);
            z-index: 1300;
          }
          .mp-mobile-panel.open {
            opacity: 1;
            max-height: 100vh;
            pointer-events: auto;
            transform: translateY(0);
          }
          .mp-mobile-inner {
            display: flex;
            flex-direction: column;
            gap: 14px; /* More gap for breathing room */
            align-items: flex-start;
          }
          .mp-mobile-link {
            padding: 12px 16px;
            border-radius: 8px;
            color: #334155;
            text-decoration: none;
            font-size: 18px;
            font-weight: 500;
            transition: background 0.2s ease, color 0.2s ease;
            width: 100%;
            text-align: left;
          }
          .mp-mobile-link:hover {
            background: rgba(0,85,255,0.06);
          }
          .mp-mobile-link.active {
            color: #0055ff;
            font-weight: 600;
          }
          .mp-mobile-login {
            color: #0055ff;
            font-weight: 700;
            text-decoration: none;
            padding: 12px 16px;
            transition: color 0.2s ease;
          }
          .mp-mobile-login:hover {
            color: #0033cc;
          }
          .mp-mobile-register {
            background: #0055ff;
            color: #fff;
            padding: 12px 16px;
            border: 0;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s ease;
          }
          .mp-mobile-register:hover {
            background: #0033cc;
          }
        }
      `}</style>

      {/* ------------------------------
              DESKTOP NAV
      ------------------------------ */}
      <div className="mp-nav-inner">
        <Link to="/" className="mp-logo" onClick={handleHomeClick}>
          <svg width="28" height="28" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="#0055ff" />
            <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.5V12.5Z" fill="white" />
          </svg>
          <span className="mp-logo-text">Montalban Jobs</span>
        </Link>

        {/* Desktop links - Added active class based on activeSection */}
        <nav className="mp-links">
          <a className="mp-link" onClick={handleHomeClick}>Home</a>
          <a className="mp-link" onClick={handleJobsClick}>Jobs</a>
          <a className="mp-link" onClick={handleAboutClick}>About Us</a>
        </nav>

        <div className="mp-actions">
          <Link to="/login" className="mp-login">Login</Link>
          <Link to="/register">
            <button className="mp-register">Register</button>
          </Link>
        </div>

        {/* Hamburger - moved outside actions so it remains visible on mobile */}
        <button
          ref={btnRef}
          className={`mp-hamburger ${open ? "open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16" stroke="#0b63ff" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4 12h16" stroke="#0b63ff" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4 17h16" stroke="#0b63ff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* ------------------------------
              MOBILE MENU - Added classes for styling and active states
        ------------------------------ */}
        <div ref={panelRef} className={`mp-mobile-panel ${open ? "open" : ""}`}>
          <div className="mp-mobile-inner">
            <a className="mp-mobile-link" onClick={handleHomeClick}>Home</a>
            <a className="mp-mobile-link" onClick={handleJobsClick}>Jobs</a>
            <a className="mp-mobile-link" onClick={handleAboutClick}>About Us</a>

            <Link to="/login" className="mp-mobile-login">Login</Link>
            <Link to="/register">
              <button className="mp-mobile-register">Register</button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

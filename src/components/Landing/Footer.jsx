import React, { useState } from 'react'
import PrivacyModal from '../PrivacyModal'
import TermsModal from '../TermsModal'

export default function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  return (
    <footer className="lp-footer" role="contentinfo">
      <style>{`
        .lp-footer{ background:#081028; color:#dbeafe; padding:42px 12px 20px; }
        .lp-footer-inner{ max-width:1100px; margin:0 auto; display:flex; flex-direction:column; gap:20px; align-items:center }

        /* Brand */
        .lp-brand{ color:rgba(255,255,255,0.95); font-weight:700; letter-spacing:0.6px; display:flex; align-items:center; gap:10px }
        .lp-brand-mark{ width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; box-shadow:0 6px 18px rgba(14,165,233,0.06) }
        .lp-brand-mark svg{ width:20px; height:20px; display:block }
        .lp-brand-text{ font-size:14px }

        /* Links row */
        .lp-links{ display:flex; gap:18px; align-items:center; flex-wrap:wrap }
        .lp-links a{ color:rgba(255,255,255,0.85); text-decoration:none; font-size:13px; padding:6px 4px }
        .lp-links a:hover{ color:#ffffff; text-decoration:underline }
        .lp-link-btn{ background:none; border:0; color:rgba(255,255,255,0.85); font-size:13px; padding:6px 4px; cursor:pointer; font-weight:600 }
        .lp-link-btn:hover{ color:#ffffff; text-decoration:underline }
        .lp-sep{ color:rgba(255,255,255,0.12) }

        /* Social icons */
        .lp-social{ display:flex; gap:12px; align-items:center }
        .lp-social a{ display:inline-flex; width:34px; height:34px; align-items:center; justify-content:center; border-radius:8px; background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.85); text-decoration:none }
        .lp-social a:hover{ background:rgba(255,255,255,0.06) }

        /* Bottom row */
        .lp-bottom{ width:100%; display:flex; flex-direction:column; gap:8px; align-items:center; border-top:1px solid rgba(255,255,255,0.03); padding-top:14px }
        .lp-bottom-inner{ max-width:1100px; width:100%; display:flex; gap:12px; align-items:center; justify-content:space-between }
        .lp-lang{ color:rgba(255,255,255,0.6); font-size:13px }
        .lp-copy{ color:rgba(255,255,255,0.56); font-size:13px }

        @media (min-width:760px){ .lp-footer-inner{ flex-direction:column } .lp-bottom{ padding-top:18px } .lp-bottom-inner{ gap:20px } }
        @media (max-width:760px){ .lp-bottom-inner{ flex-direction:column; align-items:center; gap:6px } }
      `}</style>

      <div className="lp-footer-inner">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-brand" aria-hidden>
            <div className="lp-brand-mark" aria-hidden>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
                <rect width="24" height="24" rx="6" fill="#0d6efd"/>
                <path d="M7 12.5C7 11.1193 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5V13.5C17 14.8807 15.8807 16 14.5 16H9.5C8.11929 16 7 14.8807 7 13.5V12.5Z" fill="white"/>
              </svg>
            </div>
            <div className="lp-brand-text">Montalban Jobs</div>
          </div>
        </div>

        <nav className="lp-links" aria-label="Footer navigation">
          <button type="button" className="lp-link-btn" onClick={() => setShowTerms(true)}>Terms of Service</button>
          <div className="lp-sep">•</div>
          <button type="button" className="lp-link-btn" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
        </nav>

        <div className="lp-social" aria-hidden>
          <a href="#" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.98 3.22 9.2 7.69 10.69.56.1.76-.24.76-.54 0-.26-.01-1.13-.02-2.05-3.13.68-3.79-1.52-3.79-1.52-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.16 1.71 1.16 1 ..." fill="currentColor"/></svg>
          </a>
          <a href="#" aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.99H7.898v-2.888h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.888h-2.33v6.99C18.343 21.128 22 16.991 22 12z" fill="currentColor"/></svg>
          </a>
        </div>

      </div>

      <div className="lp-bottom" aria-hidden>
        <div className="lp-bottom-inner">
          <div className="lp-lang">English ▾</div>
          <div className="lp-copy">© {new Date().getFullYear()} Montalban Jobs. All rights reserved.</div>
        </div>
      </div>
        {showPrivacy && <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />}
        {showTerms && <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />}
    </footer>
  )
}

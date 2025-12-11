import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../../assets/1.jpg";
import heroImg2 from "../../assets/13.jpg";
import heroImg3 from "../../assets/14.jpg";

export default function HeroSection() {
  const navigate = useNavigate();

  function handleGetStarted(e) {
    e.preventDefault();
    navigate('/login');
  }

  function handleLearnMore(e) {
    e.preventDefault();
    const target = document.getElementById('about-title');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="lp-hero" role="region" aria-labelledby="hero-heading">
      <style>{`
        .lp-hero{ display:flex; align-items:center; justify-content:center; padding:40px 20px; background:#f9fafb; position:relative; min-height:600px }
        .lp-hero-inner{ display:flex; align-items:center; justify-content:space-between; max-width:1280px; width:100%; gap:56px }

        /* LEFT: Text only */
        .lp-hero-content{ flex:1; position:relative; z-index:2; min-width:300px }
        .lp-hero-title{ font-size:52px; line-height:1.15; margin:0 0 12px 0; color:#072146; font-weight:900; letter-spacing:-0.02em }
        .lp-hero-title .accent{ color:#0b63ff }
        .lp-hero-sub{ margin:0; color:#64748b; font-size:18px; line-height:1.6; max-width:520px }

        .lp-hero-cta{ display:flex; gap:16px; margin-top:28px }
        .lp-btn{ border:0; padding:13px 28px; border-radius:999px; font-weight:700; cursor:pointer; font-size:15px; transition:all 0.3s }
        .lp-btn-primary{ background: linear-gradient(180deg,#0b63ff,#3580ff); color:#fff; box-shadow:0 12px 30px rgba(11,99,255,0.2) }
        .lp-btn-primary:hover{ transform:translateY(-2px); box-shadow:0 16px 40px rgba(11,99,255,0.25) }
        .lp-btn-ghost{ background:transparent; border:2px solid #e2e8f0; color:#1e293b; font-weight:600 }
        .lp-btn-ghost:hover{ border-color:#0b63ff; color:#0b63ff }

        /* RIGHT: Image block — large card left, two stacked small cards right */
        .lp-hero-images{ flex:1; display:flex; gap:18px; width:100%; min-width:320px; align-items:flex-start }
        .lp-hero-images-left{ flex:0 0 62%; }
        .lp-hero-images-left img{ width:100%; height:420px; border-radius:18px; object-fit:cover; box-shadow:0 20px 50px rgba(0,0,0,0.12); display:block }
        .lp-hero-images-right{ flex:0 0 36%; display:flex; flex-direction:column; gap:18px }
        .lp-hero-images-right img{ width:100%; height:200px; border-radius:14px; object-fit:cover; box-shadow:0 12px 32px rgba(0,0,0,0.12) }

        @media (max-width:1024px){ .lp-hero-inner{ flex-direction:column; gap:36px; align-items:center } .lp-hero-content{ width:100%; text-align:center } .lp-hero-images{ width:100%; flex-direction:column } .lp-hero-images-left img{ height:360px } .lp-hero-images-right img{ height:160px } .lp-hero-title{ font-size:40px } }
        @media (max-width:720px){ .lp-hero-inner{ flex-direction:column; gap:20px } .lp-hero-content{ width:100%; text-align:center } .lp-hero-images{ width:100%; flex-direction:column } .lp-hero-title{ font-size:28px } .lp-hero-sub{ font-size:16px } .lp-hero-images-left img { height:220px; border-radius:12px } .lp-hero-images-right img{ height:120px } .lp-hero-cta{ flex-direction:column; justify-content:center } .lp-btn{ width:100% } }
      `}</style>

      <div className="lp-hero-inner">
        {/* LEFT: Text Only */}
        <div className="lp-hero-content">
          <h1 id="hero-heading" className="lp-hero-title">
            <span className="accent">Find Your Next Job,</span><br /> in Montalban.
          </h1>
          <p className="lp-hero-sub">
            Connect with local employers, explore nearby job opportunities, and start applying with confidence — all in one place for the Montalban community.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn lp-btn-primary" onClick={handleGetStarted}>Get Started</button>
            <button className="lp-btn lp-btn-ghost" onClick={handleLearnMore}>Learn More</button>
          </div>
        </div>

        {/* RIGHT: Image block — large card left, two stacked small cards right */}
        <div className="lp-hero-images">
          <div className="lp-hero-images-left">
            <img src={heroImg} alt="Team large" />
          </div>
          <div className="lp-hero-images-right">
            <img src={heroImg2} alt="Team small 1" />
            <img src={heroImg3} alt="Team small 2" />
          </div>
        </div>
      </div>
    </section>
  );
}

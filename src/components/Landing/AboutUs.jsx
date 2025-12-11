import React, { useEffect, useRef, useState } from "react";
import img2 from '../../assets/2.jpg';
import img3 from '../../assets/3.jpg';
import img4 from '../../assets/4.jpg';
import img5 from '../../assets/5.jpg';
import img6 from '../../assets/6.jpg';
import img7 from '../../assets/7.jpg';
import img8 from '../../assets/8.jpg';
import img9 from '../../assets/9.jpg';
import img10 from '../../assets/10.jpg';
import img11 from '../../assets/11.jpg';

/*
  AboutUs.jsx - Modern About Us section
  - Two-column top area: left text, right illustration
  - Team area: Project Manager centered, other members in a grid below
  - Vertical cards on desktop, swipeable row on small screens
  - Inline CSS only
*/

const TEAM = [
  { 
    id: 1, 
    name: "Valera, Rochelle Mae S.", 
    role: "Project Manager", 
    desc: "Leads project planning, coordinates cross-functional teams, and ensures timely delivery of high-quality solutions while maintaining clear communication with stakeholders.", 
    email: "valeara@gmail.com", 
    img: img2 
  },
  { 
    id: 2, 
    name: "Cilot, Mark Ylram V.", 
    role: "Frontend Developer", 
    desc: "Builds delightful UIs and accessibility.", 
    email: "ylrammark@gmail.com", 
    img: img3 
  },
  { 
    id: 3, 
    name: "Perante, Julius C.", 
    role: "Frontend Developer", 
    desc: "Designs and develops visually engaging and responsive web pages that users interact with.", 
    email: "juliusperante2003@gmail.com", 
    img: img4 
  },
  { 
    id: 4, 
    name: "Enage, Daryll kyte T.", 
    role: "UI/UX Designer", 
    desc: "Crafts user-friendly interfaces, wireframes, and prototypes to enhance user experience.", 
    email: "daryllkyte09@gmail.com", 
    img: img5 
  },
  { 
    id: 5, 
    name: "Macarang, James Patrick M.", 
    role: "Mobile Developer", 
    desc: "Develops mobile applications with a focus on usability and performance across devices.", 
    email: "jamespatrickmacarangii@gmail.com", 
    img: img6 
  },
  { 
    id: 6, 
    name: "Lotino, David Aaron D.", 
    role: "Documentation / Technical Writer", 
    desc: "Creates clear documentation, guides, and README files to support the team and users.", 
    email: "lotinodavidaaron5@gmail.com", 
    img: img7 
  },
  { 
    id: 7, 
    name: "Solsona,John Steven M.", 
    role: "QA / Tester", 
    desc: "Tests features, reports bugs, and ensures the quality and reliability of the project.", 
    email: "johnsolsona30@gmail.com", 
    img: img8 
  },
  { 
    id: 8, 
    name: "John Lloyd L. Nadura", 
    role: "Full Stack Developer", 
    desc: "Builds scalable and robust applications, handling everything from database design and APIs to responsive user interfaces, ensuring seamless user experiences.", 
    email: "nadurajohnlloyd8@gmail.com", 
    img: img9 
  }
];


export default function AboutUs() {
  // Render the whole team as a simple grid
  const members = TEAM;

  const [active, setActive] = useState(0);
  const trackRef = useRef(null);

  // keyboard navigation: Arrow keys adapt to layout (vertical desktop, horizontal mobile)
  useEffect(() => {
    function onKey(e) {
      const mobile = window.matchMedia('(max-width:520px)').matches;
      if (mobile) {
        if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setActive((i) => Math.min(members.length - 1, i + 1));
      } else {
        if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1));
        if (e.key === 'ArrowDown') setActive((i) => Math.min(members.length - 1, i + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [members.length]);

  // scroll active into view
  useEffect(() => {
    const el = trackRef.current?.querySelectorAll('.au-member-card')?.[active];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [active]);

  return (
    <section className="au-section" aria-labelledby="about-title">
      <style>{`
      .au-section{ padding:40px 20px; background: linear-gradient(180deg,#fff,#f8fbff); }
      .au-inner{ max-width:1100px; margin:0 auto }

      /* Top two-column area */
      .au-top{ display:flex; gap:28px; align-items:center; margin-bottom:32px; align-items:stretch }
      .au-left{ flex:1 }
      .au-right{ width:380px; flex-shrink:0 }
      .au-heading{ font-size:48px; line-height:1.03; margin:0 0 10px 0; color:#0f1724; font-weight:900 }
      .au-sub{ color:#475569; line-height:1.6; margin:0; font-size:15px }

      /* Intro badge + features + media */
      .au-label{ display:inline-block; background:#fff; color:#0b63ff; border:1px solid rgba(11,99,255,0.12); padding:6px 10px; border-radius:999px; font-size:12px; margin-bottom:12px }
      .intro-accent{ color:#0b63ff; font-weight:900; margin-right:8px; display:inline-block; font-size:48px }
      .au-heading-strong{ color:#072146; font-weight:900 }
      .au-top-row{ display:flex; gap:6px; align-items:flex-start }
      .au-top-left{ flex:1; max-width:680px }
      .au-top-left{ flex:1 }
      .au-top-right-cols{ width:360px; display:grid; grid-template-columns:repeat(2,1fr); gap:12px; font-size:14px; color:#475569; line-height:1.5; align-self:flex-start }
      .au-features{ display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-top:14px; margin-bottom:22px; align-items:start }
      .feature-card{ background:#fff; border-radius:18px; padding:14px 18px; box-shadow:0 12px 30px rgba(11,99,255,0.04); display:flex; gap:14px; align-items:center; min-width:0; height:86px }
      .feature-text{ display:flex; flex-direction:column; justify-content:center }
      .feature-icon{ width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:999px; background:#e8f0ff; color:#0b63ff; font-size:20px; box-shadow:0 8px 22px rgba(11,99,255,0.08) }
      .feature-title{ font-weight:800; color:#072146; font-size:14px }
      .feature-sub{ color:#475569; font-size:13px }

      .au-media{ display:flex; gap:18px; margin-top:22px; position:relative }
      .media-left{ flex:1; border-radius:20px; overflow:hidden; position:relative }
      .media-left img{ width:100%; height:320px; object-fit:cover; display:block }
      .media-right{ width:240px; height:150px; border-radius:14px; overflow:hidden; position:absolute; right:-48px; top:50%; transform:translateY(-50%); box-shadow:0 14px 36px rgba(2,6,23,0.12) }
      .media-right img{ width:100%; height:100%; object-fit:cover; display:block }
      .media-right .play{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:56px; height:56px; border-radius:999px; background:#0b63ff; color:white; display:flex; align-items:center; justify-content:center; font-size:20px }


      /* Team area (grid-style header + 4-up grid) */
      .au-team{ margin-top:48px }
      .au-team-header{ text-align:center; margin-bottom:18px }
      .au-team-sub{ font-size:12px; color:#94a3b8; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px }
      .au-team-main{ font-size:34px; color:#072146; margin:0; font-weight:800; letter-spacing:2px }
      .au-team-underline{ width:64px; height:4px; background:#0b63ff; margin:14px auto; border-radius:3px }

      /* Grid of team cards (4-up desktop) */
      .au-grid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:28px; align-items:start; justify-items:center }
      .au-member-card{ background:transparent; border-radius:12px; padding:8px 12px; display:flex; flex-direction:column; gap:8px; align-items:center; text-align:center; transition:transform .22s ease, box-shadow .22s ease; min-height:220px }
      .au-member-card.active{ transform:translateY(-6px); }

      /* hexagon avatar */
      .hex{ width:160px; height:160px; clip-path: polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0% 50%); overflow:hidden; margin:0 auto; box-shadow:0 10px 30px rgba(2,6,23,0.08); }
      .hex img{ width:100%; height:100%; object-fit:cover; display:block }

      .au-meta{ flex:0 0 auto; padding-top:8px }
      .au-name{ margin:0; font-size:14px; color:#022047; font-weight:800; text-transform:uppercase }
      .au-role{ margin-top:6px; color:#0b63ff; font-size:12px; font-weight:700; text-transform:uppercase }
      .au-desc{ margin-top:8px; color:#6b7280; font-size:13px; max-width:240px }
      .au-email{ margin-top:8px; color:#6b7280; font-size:12px }

      /* Mobile: make members swipeable row */
      @media (max-width:880px){ .au-grid{ grid-template-columns: repeat(2, 1fr) } .au-right{ display:none } }
      @media (max-width:520px){
        .au-top{ flex-direction:column; align-items:stretch }
        .au-top-row{ flex-direction:column }
        .au-top-right-cols{ width:100%; display:block }
        .au-grid{ grid-template-columns: repeat(1, 1fr); display:grid; gap:16px }
        .au-grid::-webkit-scrollbar{ display:none }
        .au-member-card{ min-width:100% }
        /* stack media on small screens */
        .au-media{ flex-direction:column }
        .media-right{ margin-left:0; width:100%; height:180px; transform:none }
      }

      /* Hover & focus for accessibility */
      .au-member-card:focus-within, .au-member-card:focus { outline: 3px solid rgba(0,85,255,0.12); }
      .au-member-card:hover { transform: translateY(-6px); box-shadow:0 20px 44px rgba(8,12,20,0.09) }

        /* Photo stack (right column) */
        @media (max-width:520px){ .au-right{ display:none } }


      `}</style>

      <div className="au-inner">
        <div className="au-top">
          <div className="au-left">
            <div className="au-label">ABOUT US</div>
            <div className="au-top-row">
              <div className="au-top-left">
              <h2 id="about-title" className="au-heading">
                <span className="intro-accent">Welcome</span> To Montalban<br/> 
                <span className="au-heading-strong">Job Portal</span>
              </h2>
              </div>

              <div className="au-top-right-cols" aria-hidden>
                <p>We connect Montalban employers and job seekers through fast, reliable, and user-friendly tools designed to make hiring easier.</p>
                <p>Our platform supports local businesses and helps residents find opportunities close to home — built with clarity, trust, and community in mind.</p>
              </div>
            </div>

            <div className="au-features" aria-hidden>
              <div className="feature-card">
                <div className="feature-icon">🔗</div>
                <div className="feature-text">
                  <div className="feature-title">Integrated with this Portal</div>
                  <div className="feature-sub">Jobs and applications sync automatically with the Montalban system in real time.</div>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <div className="feature-text">
                  <div className="feature-title">Realtime Analytics</div>
                  <div className="feature-sub">Live metrics on applicants, views, and hiring funnels for informed decisions.</div>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <div className="feature-text">
                  <div className="feature-title">Employer Support</div>
                  <div className="feature-sub">Onboarding and dedicated support for employers using the portal features.</div>
                </div>
              </div>
            </div>

            <div className="au-media" aria-hidden>
              <div className="media-left"><img src={img10} alt="office" loading="lazy" /></div>
              <div className="media-right"><img src={img11} alt="video thumbnail" loading="lazy" /><div className="play">▶</div></div>
            </div>
          </div>
          {/* right column removed: au-photo-stack intentionally removed per request */}
        </div>

        <div className="au-team">
          <div className="au-team-header" aria-hidden>
            <div className="au-team-sub">MEET OUR TEAM</div>
            <h3 className="au-team-main">OUR TEAM</h3>
            <div className="au-team-underline" aria-hidden></div>
          </div>

          <div ref={trackRef} className="au-grid" aria-label="Developers list">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`au-member-card au-member-card-${m.id} ${active === i ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setActive(i)}
                onKeyDown={(e) => { if (e.key === 'Enter') setActive(i) }}
              >
                <div className="hex"><img src={m.img} alt={m.name} loading="lazy" /></div>
                <div className="au-meta">
                  <h4 className="au-name">{m.name}</h4>
                  <div className="au-role">{m.role}</div>
                  <p className="au-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

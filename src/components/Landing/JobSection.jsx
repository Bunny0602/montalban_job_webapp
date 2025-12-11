// src/components/landing/JobSection.jsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

const JobSection = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      where("approvalStatus", "==", "approved")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(jobList);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching jobs:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // close modal on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
        setSelectedJob(null);
      }
    };
    if (isModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  // navigate to job details (used on card button)
  // const handleApply = () => { navigate("/login"); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <h2 id="jobs-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Featured Jobs</h2>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ border: "1px solid #e6eefc", borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 18px rgba(13,85,255,0.03)", background: "#fff", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140, padding: 16 }}>
              <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', marginBottom: 12, background: 'linear-gradient(90deg,#f3f7ff 25%, #e9f0ff 50%, #f3f7ff 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite' }} />

              <div>
                <div style={{ width: '60%', height: 16, borderRadius: 6, background: 'linear-gradient(90deg,#f3f7ff 25%, #e9f0ff 50%, #f3f7ff 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite', marginBottom: 8 }} />

                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 60, height: 20, borderRadius: 8, background: 'linear-gradient(90deg,#f3f7ff 25%, #e9f0ff 50%, #f3f7ff 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite' }} />
                  <div style={{ width: 40, height: 20, borderRadius: 8, background: 'linear-gradient(90deg,#f3f7ff 25%, #e9f0ff 50%, #f3f7ff 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite' }} />
                </div>

                <div style={{ width: '100%', height: 40, borderRadius: 6, background: 'linear-gradient(90deg,#f3f7ff 25%, #e9f0ff 50%, #f3f7ff 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite' }} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ width: '100%', height: 36, borderRadius: 10, background: 'linear-gradient(90deg,#e6eefc 25%, #dfefff 50%, #e6eefc 75%)', backgroundSize: '200% 100%', animation: 'skeleton-loading 1.2s linear infinite' }} />
              </div>
            </div>
          ))}

          <style>{`@keyframes skeleton-loading{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        </div>
      ) : jobs.length === 0 ? (
        <p>No approved jobs available at the moment.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20
        }}>
          {jobs.map(job => {
            const desc = job.description || job.jobDescription || job.jobDesc || job.details || "No description provided.";
            const excerpt = desc.length > 140 ? desc.slice(0, 137) + "..." : desc;
            return (
              <div key={job.id} style={{
                border: "1px solid #e6eefc",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(13,85,255,0.06)",
                background: "#fff",
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 140,
                padding: 16
              }}>
                {/* image container */}
                <div style={{ width: '100%', height: 140, background: '#f3f7ff', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  {job.jobImage ? (
                    <img src={job.jobImage} alt={job.jobTitle || job.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <img src={`https://source.unsplash.com/collection/888146/800x400?sig=${job.id}`} alt="job" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px 0", color: '#072146' }}>{job.jobTitle || job.title || 'Untitled Role'}</h3>

                  {/* Experience & skills (compact) */}
                  { (job.experience || job.experienceLevel || (job.skills && job.skills.length)) && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      { (job.experience || job.experienceLevel) && (
                        <div style={{ background: '#eef6ff', color: '#0366d6', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight:700 }}>{job.experience || job.experienceLevel}</div>
                      )}
                      {Array.isArray(job.skills) && job.skills.length > 0 && (
                        <div style={{ display: 'flex', gap:6, flexWrap:'wrap' }}>
                          {job.skills.slice(0,3).map((s, i) => (
                            <span key={i} style={{ background:'#f1f5fb', color:'#335680', padding:'4px 8px', borderRadius:8, fontSize:12 }}>{s}</span>
                          ))}
                          {job.skills.length > 3 && <span style={{ color:'#6b7280', fontSize:12 }}>+{job.skills.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>{excerpt}</p>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => { setSelectedJob(job); setIsModalOpen(true); }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 10,
                      border: "none",
                      background: "#0055ff",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#0044cc'}
                    onMouseOut={e => e.currentTarget.style.background = '#0055ff'}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Modal preview for selected job (view only) */}
      {isModalOpen && selectedJob && (
        <div className="job-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="job-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="job-modal-backdrop" onClick={() => { setIsModalOpen(false); setSelectedJob(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.46)' }} />

          <div className="job-modal" style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 'min(760px, 96%)', maxHeight: '90vh', overflowY: 'auto', zIndex: 1401, boxShadow: '0 30px 90px rgba(2,6,23,0.2)' }}>
            <div style={{ padding: 0 }}>
              {/* Top image for portrait layout */}
              <div style={{ width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden', background: '#f3f7ff' }}>
                <img src={selectedJob.jobImage || `https://source.unsplash.com/collection/888146/1200x600?sig=${selectedJob.id}`} alt="job" style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }} />
              </div>

              <div style={{ padding: 20 }}>
                <h3 id="job-modal-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#072146' }}>{selectedJob.jobTitle || selectedJob.title}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <p style={{ color: '#556', margin: 0 }}>{selectedJob.company || selectedJob.employer || ''}</p>
                  {selectedJob.location && <span style={{ color: '#475569', fontSize: 13 }}>· {selectedJob.location}</span>}
                  {(selectedJob.experience || selectedJob.experienceLevel) && <div style={{ marginLeft: 'auto', background: '#eef6ff', color: '#0366d6', padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{selectedJob.experience || selectedJob.experienceLevel}</div>}
                </div>

                {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedJob.skills.map((s, i) => (
                        <span key={i} style={{ background: '#f1f5fb', color: '#0b3b66', padding: '6px 10px', borderRadius: 999, fontSize: 13 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ color: '#333', lineHeight: 1.6, marginTop: 12 }}>{selectedJob.description || selectedJob.jobDescription || selectedJob.jobDesc || selectedJob.details || 'No description provided.'}</div>

                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button onClick={() => { setIsModalOpen(false); navigate('/login'); }} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: '#0055ff', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Apply</button>
                  <button onClick={() => { setIsModalOpen(false); setSelectedJob(null); }} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e6eefc', background: '#fff', cursor: 'pointer' }}>Close</button>
                </div>

                {selectedJob.salary && <div style={{ marginTop: 12, color: '#475569', fontSize: 14 }}>Salary: <strong style={{ color: '#072146' }}>{selectedJob.salary}</strong></div>}
              </div>
            </div>
          </div>

          <style>{`
            .job-modal { transition: transform 220ms cubic-bezier(.2,.8,.2,1), opacity 220ms; }
            .job-modal-overlay .job-modal { transform: translateY(0); opacity: 1; }
            @media (max-width: 720px) {
              .job-modal img { height: 200px !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default JobSection;

import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <Head title="UCIMS-University of Southeastern Philippines Clinic" />
            <div className="page active" id="page-home" style={{ fontFamily: "'Open Sans', sans-serif", background: "#F5F4F0", color: "#1A1A1A" }}>
                <div className="home-wrap" style={{ background: "linear-gradient(160deg, #760000 0%, #4a0000 50%, #1A3A6B 100%)", display: "flex", flexDirection: "column" }}>

                    {/* Topbar */}
                    <div className="home-topbar" style={{ padding: "0 48px", height: "110px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #C9A227", flexShrink: 0, position: "relative", zIndex: 100, pointerEvents: "auto" }}>
                        <img src="/assets/img/logoHeader.jpg" className="home-header-logo" alt="USeP — We Build Dreams Without Limits" style={{ height: "82px", width: "auto", objectFit: "contain", display: "block" }} />
                        <nav className="home-nav" style={{ display: "flex", gap: "6px", alignItems: "center", pointerEvents: "auto" }}>
                            <a href="#section-services" className="home-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('section-services'); }} style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.82)", padding: "8px 18px", borderRadius: "6px", border: "1px solid transparent", textDecoration: "none", cursor: "pointer", pointerEvents: "auto" }}>Services</a>
                            <a href="#section-about" className="home-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('section-about'); }} style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.82)", padding: "8px 18px", borderRadius: "6px", border: "1px solid transparent", textDecoration: "none", cursor: "pointer", pointerEvents: "auto" }}>About</a>
                            <a href="#section-socials" className="home-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('section-socials'); }} style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.82)", padding: "8px 18px", borderRadius: "6px", border: "1px solid transparent", textDecoration: "none", cursor: "pointer", pointerEvents: "auto" }}>Contact</a>
                            <Link href="/tv-queue" className="home-nav-link" style={{ color: "#C9A227", borderColor: "#C9A227", border: "1px solid #C9A227", fontFamily: "'Open Sans', sans-serif", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", padding: "8px 18px", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", pointerEvents: "auto" }}>📺 Live Queue</Link>
                        </nav>
                    </div>

                    {/* Hero Section */}
                    <div className="home-body" id="section-hero" style={{ minHeight: "calc(100vh - 110px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 80px", flexShrink: 0, position: "relative", zIndex: 10, pointerEvents: "auto" }}>
                        <div className="home-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "800px", textAlign: "center", margin: "0 auto", pointerEvents: "auto" }}>
                            <div className="home-center" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "auto" }}>
                                <div className="home-univ" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#C9A227", marginBottom: "8px" }}>University of Southeastern Philippines</div>
                                <div className="home-system" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "3.8rem", color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>Clinic Information<br />Management System</div>
                                <div className="home-tagline-sub" style={{ fontSize: "1.08rem", color: "rgba(255,255,255,0.72)", marginBottom: "35px", maxWidth: "600px", lineHeight: 1.65 }}>A centralized digital platform for managing clinic visits, patient records, consultations, and health documentation securely.</div>
                                
                                <div className="home-btns" style={{ justifyContent: "center", marginBottom: "40px", width: "100%", display: "flex", gap: "20px", maxWidth: "500px", position: "relative", zIndex: 999, pointerEvents: "auto" }}>
                                    {auth?.user ? (
                                        <a href="/dashboard" className="btn btn-white btn-lg" style={{ flex: 1, background: "#ffffff", color: "#560D0F", padding: "16px 38px", fontSize: "1.08rem", borderRadius: "10px", fontWeight: 600, textAlign: "center", textDecoration: "none", display: "inline-block", cursor: "pointer", pointerEvents: "auto" }}>Go to Dashboard</a>
                                    ) : (
                                        <>
                                            <a href="/login" className="btn btn-white btn-lg" style={{ flex: 1, background: "#ffffff", color: "#560D0F", padding: "16px 38px", fontSize: "1.08rem", borderRadius: "10px", fontWeight: 600, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", cursor: "pointer", pointerEvents: "auto" }}>👤 Patient Login</a>
                                            <a href="/login" className="btn btn-white-outline btn-lg" style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.5)", color: "#ffffff", padding: "16px 38px", fontSize: "1.08rem", borderRadius: "10px", fontWeight: 600, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", cursor: "pointer", pointerEvents: "auto" }}>🔒 Staff Login</a>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="home-info" style={{ width: "100%", maxWidth: "800px", marginTop: "10px" }}>
                                <div className="home-info-card" style={{ padding: "28px 40px", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
                                    <div className="home-info-icon" style={{ fontSize: "1.8rem", marginBottom: "8px", color: "#C9A227" }}>🎯</div>
                                    <div className="home-info-title" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px" }}>System Objective</div>
                                    <div className="home-info-text" style={{ fontSize: "0.95rem", textAlign: "center", color: "rgba(255,255,255,0.95)", lineHeight: 1.6 }}>
                                        The general objective of the proposed University Clinic Information Management System (UCIMS) is to develop a web-based, role-based platform that streamlines and automates the operational workflow of the university clinic, enhancing the efficiency of patient registration, consultation management, and clinical documentation while ensuring data integrity and user-specific access control.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Services Section */}
                    <section className="home-section" id="section-services" style={{ background: "#F5F3EF", minHeight: "100vh", display: "flex", alignItems: "center", padding: "70px 100px", flexShrink: 0, color: "#1A1A1A", pointerEvents: "auto", position: "relative", zIndex: 10 }}>
                        <div className="home-section-inner" style={{ maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
                            <div className="home-section-label" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "0.92rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#760000", marginBottom: "12px" }}>What We Offer</div>
                            <h2 className="home-section-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "3rem", color: "#5a0000", marginBottom: "18px", lineHeight: 1.15 }}>Services Offered</h2>
                            <p className="home-section-sub" style={{ fontSize: "1.05rem", color: "#6A6460", marginBottom: "50px", maxWidth: "900px", lineHeight: 1.7 }}>The USeP University Clinic provides comprehensive health services to students and personnel.</p>
                            <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "28px" }}>
                                {[
                                    { name: "Check-Up", icon: "bi-heart-pulse", desc: "General medical consultations and physical examinations conducted by licensed clinic physicians and nurses for students and staff." },
                                    { name: "Medicine Request", icon: "bi-capsule", desc: "Patients may request available medicines from the clinic's pharmacy for treatment of minor illnesses and health conditions." },
                                    { name: "Follow-Up Consultation", icon: "bi-calendar-check", desc: "Scheduled follow-up visits to monitor ongoing health conditions and review treatment progress after an initial consultation." },
                                    { name: "Medical Certificate Request", icon: "bi-file-earmark-medical", desc: "Issuance of official medical certificates for school, employment, OJT clearance, sick leave, and return-to-work or school purposes." }
                                ].map((s, idx) => (
                                    <div key={idx} className="service-card" style={{ background: "#fff", borderRadius: "16px", padding: "38px 28px", border: "1px solid #DDD9D0", borderTop: "5px solid #760000", boxShadow: "0 4px 18px rgba(0,0,0,0.06)" }}>
                                        <div className="service-icon" style={{ fontSize: "2.6rem", color: "#760000", marginBottom: "20px" }}><i className={`bi ${s.icon}`}></i></div>
                                        <div className="service-name" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.35rem", fontWeight: 700, letterSpacing: "0.5px", color: "#5a0000", marginBottom: "14px", textTransform: "uppercase" }}>{s.name}</div>
                                        <div className="service-desc" style={{ fontSize: "0.95rem", color: "#6A6460", lineHeight: 1.7 }}>{s.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="home-section home-section-dark" id="section-about" style={{ background: "linear-gradient(135deg, #760000 0%, #4a0000 60%, #1a1a2e 100%)", minHeight: "100vh", display: "flex", alignItems: "center", padding: "70px 100px", flexShrink: 0, color: "#fff", pointerEvents: "auto", position: "relative", zIndex: 10 }}>
                        <div className="home-section-inner" style={{ maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
                            <div className="about-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
                                <div className="about-left" style={{ display: "flex", flexDirection: "column" }}>
                                    <div className="home-section-label" style={{ color: "#E8C84A", fontFamily: "'Open Sans', sans-serif", fontSize: "0.92rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: "12px" }}>Background</div>
                                    <h2 className="home-section-title about-section-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "18px", lineHeight: 1.15 }}>About the System</h2>
                                    <div className="about-rule" style={{ width: "60px", height: "3px", background: "#C9A227", margin: "20px 0 28px", borderRadius: "2px" }}></div>
                                    <div className="about-text" style={{ fontSize: "1.02rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.9 }}>
                                        <p style={{ textIndent: "2.2em", textAlign: "justify", marginBottom: "1.3em" }}>The <strong>University Clinic Information Management System (UCIMS)</strong> is a web-based information system developed to serve as a <strong>centralized digital registry</strong> for the healthcare services of the University of Southeastern Philippines.</p>
                                        <p style={{ textIndent: "2.2em", textAlign: "justify", marginBottom: "1.3em" }}>The project aims to <strong>modernize the management of clinic operations</strong> by integrating patient registration, consultation documentation, medical history tracking, and certificate processing into a <strong>unified digital platform</strong>.</p>
                                        <p style={{ textIndent: "2.2em", textAlign: "justify", marginBottom: 0 }}>Ultimately, UCIMS supports the delivery of <strong>quality healthcare services</strong> within the university.</p>
                                    </div>
                                </div>
                                <div className="about-photo-col" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <img src="/assets/img/team.jpg" className="about-photo" alt="UCIMS Research Team" style={{ width: "100%", maxWidth: "580px", height: "360px", objectFit: "cover", borderRadius: "10px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", display: "block" }} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact / Socials Section */}
                    <section className="home-section home-section-socials" id="section-socials" style={{ padding: "50px 100px", background: "#F5F3EF", flexShrink: 0, color: "#1A1A1A", pointerEvents: "auto", position: "relative", zIndex: 10 }}>
                        <div className="home-section-inner home-section-inner-center" style={{ maxWidth: "1300px", margin: "0 auto", width: "100%", textAlign: "center" }}>
                            <div className="home-section-label" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "0.92rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#760000", marginBottom: "12px" }}>Get in Touch</div>
                            <h2 className="home-section-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "3rem", color: "#5a0000", marginBottom: "18px", lineHeight: 1.15 }}>Connect With Us</h2>
                            <p className="home-section-sub home-section-sub-center" style={{ fontSize: "1.05rem", color: "#6A6460", marginBottom: "50px", maxWidth: "900px", lineHeight: 1.7, marginLeft: "auto", marginRight: "auto" }}>Reach out to the University of Southeastern Philippines through our official channels.</p>
                            <div className="socials-grid" style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", pointerEvents: "auto" }}>
                                <a className="social-card" href="https://www.facebook.com/USePofficial" target="_blank" rel="noopener" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px", background: "#fff", border: "1px solid #DDD9D0", borderRadius: "12px", padding: "16px 26px", textDecoration: "none", color: "#1A1A1A", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", pointerEvents: "auto" }}>
                                    <div className="social-icon facebook" style={{ fontSize: "1.15rem", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#1877F2", flexShrink: 0 }}><i className="bi bi-facebook"></i></div>
                                    <div className="social-text" style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}><div className="social-name" style={{ fontWeight: 700, fontSize: "0.92rem" }}>Facebook</div><div className="social-handle" style={{ fontSize: "0.8rem", color: "#6A6460" }}>@USePofficial</div></div>
                                </a>
                                <a className="social-card" href="https://www.instagram.com/usepofficial/" target="_blank" rel="noopener" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px", background: "#fff", border: "1px solid #DDD9D0", borderRadius: "12px", padding: "16px 26px", textDecoration: "none", color: "#1A1A1A", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", pointerEvents: "auto" }}>
                                    <div className="social-icon instagram" style={{ fontSize: "1.15rem", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", flexShrink: 0 }}><i className="bi bi-instagram"></i></div>
                                    <div className="social-text" style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}><div className="social-name" style={{ fontWeight: 700, fontSize: "0.92rem" }}>Instagram</div><div className="social-handle" style={{ fontSize: "0.8rem", color: "#6A6460" }}>@usepofficial</div></div>
                                </a>
                                <a className="social-card" href="mailto:pad@usep.edu.ph" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px", background: "#fff", border: "1px solid #DDD9D0", borderRadius: "12px", padding: "16px 26px", textDecoration: "none", color: "#1A1A1A", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", pointerEvents: "auto" }}>
                                    <div className="social-icon email" style={{ fontSize: "1.15rem", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#760000", flexShrink: 0 }}><i className="bi bi-envelope-fill"></i></div>
                                    <div className="social-text" style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}><div className="social-name" style={{ fontWeight: 700, fontSize: "0.92rem" }}>Email</div><div className="social-handle" style={{ fontSize: "0.8rem", color: "#6A6460" }}>pad@usep.edu.ph</div></div>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="home-footer" style={{ background: "#3a0000", borderTop: "3px solid #C9A227", padding: "20px 40px", textAlign: "center", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>
                        <span>© 2026 University of Southeastern Philippines — University Clinic Information Management System</span>
                    </footer>

                </div>
            </div>
        </>
    );
}
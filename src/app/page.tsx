'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const userData = getUser();
      setIsLoggedIn(authenticated);
      setUser(userData);
    };
    
    checkAuth();
    
    // Redirect if already logged in
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
    
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`navbar-landing ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <i className="fas fa-briefcase"></i>
            <span>Job<span>Hunt</span></span>
          </div>
          
          <div className="nav-links">
            <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link">How It Works</button>
            <button onClick={() => scrollToSection('stats')} className="nav-link">Stats</button>
            <button onClick={() => scrollToSection('contact')} className="nav-link">Contact</button>
          </div>
          
          <div className="nav-buttons">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="btn-login">Sign In</Link>
                <Link href="/signup" className="btn-signup">Get Started</Link>
              </>
            ) : (
              <Link href="/dashboard" className="btn-dashboard">
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
            )}
          </div>
          
          <button className="mobile-menu-btn" id="mobileMenuBtn">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🚀</span>
              <span>AI-Powered Job Platform</span>
            </div>
            <h1 className="hero-title">
              Find Your Dream Job & 
              <span className="gradient-text"> Scholarship</span>
            </h1>
            <p className="hero-description">
              Discover thousands of job opportunities and scholarships worldwide. 
              Our AI-powered platform matches you with the perfect opportunities based on your skills and preferences.
            </p>
            <div className="hero-buttons">
              <Link href="/signup" className="btn-primary-hero">
                Get Started Free
                <i className="fas fa-arrow-right"></i>
              </Link>
              <button onClick={() => scrollToSection('features')} className="btn-secondary-hero">
                Learn More
                <i className="fas fa-play"></i>
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">15K+</span>
                <span className="stat-label">Active Jobs</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Scholarships</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Countries</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Happy Users</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="floating-card card-1">
                <i className="fas fa-briefcase"></i>
                <span>Remote Job</span>
              </div>
              <div className="floating-card card-2">
                <i className="fas fa-graduation-cap"></i>
                <span>Scholarship</span>
              </div>
              <div className="floating-card card-3">
                <i className="fas fa-chart-line"></i>
                <span>Career Growth</span>
              </div>
              <div className="hero-graphic"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Why Choose Us</span>
            <h2>Powerful Features to Boost Your Career</h2>
            <p>Everything you need to find the perfect opportunity in one place</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-robot"></i>
              </div>
              <h3>AI-Powered Matching</h3>
              <p>Our advanced AI algorithms match you with jobs and scholarships tailored to your profile.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>Global Opportunities</h3>
              <p>Access opportunities from over 50 countries worldwide, updated in real-time.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bell"></i>
              </div>
              <h3>Smart Alerts</h3>
              <p>Get instant notifications when new opportunities matching your criteria appear.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-simple"></i>
              </div>
              <h3>Application Tracking</h3>
              <p>Track all your applications in one place and see your progress.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bookmark"></i>
              </div>
              <h3>Save & Organize</h3>
              <p>Save interesting opportunities and organize them for later review.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure & Verified</h3>
              <p>All opportunities are verified to ensure legitimacy and security.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2>How JobHunt Works</h2>
            <p>Get started in just a few simple steps</p>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3>Create Account</h3>
              <p>Sign up for free and create your profile in minutes</p>
            </div>
            
            <div className="step-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Search & Filter</h3>
              <p>Use our advanced filters to find the best opportunities</p>
            </div>
            
            <div className="step-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">
                <i className="fas fa-paper-plane"></i>
              </div>
              <h3>Apply & Track</h3>
              <p>Apply directly and track your applications</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section-landing">
        <div className="container">
          <div className="stats-grid-landing">
            <div className="stat-item-landing">
              <div className="stat-number-landing">15,000+</div>
              <div className="stat-label-landing">Jobs Posted</div>
            </div>
            <div className="stat-item-landing">
              <div className="stat-number-landing">500+</div>
              <div className="stat-label-landing">Scholarships</div>
            </div>
            <div className="stat-item-landing">
              <div className="stat-number-landing">50+</div>
              <div className="stat-label-landing">Companies</div>
            </div>
            <div className="stat-item-landing">
              <div className="stat-number-landing">10,000+</div>
              <div className="stat-label-landing">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Next Opportunity?</h2>
            <p>Join thousands of successful job seekers and scholars who found their path through JobHunt</p>
            <Link href="/signup" className="btn-cta">
              Start Your Journey Today
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Have questions? We're here to help you succeed.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <span>support@jobhunt.com</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>123 Career Street, Silicon Valley, CA</span>
                </div>
              </div>
              <div className="social-links">
                <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                <a href="#" className="social-link"><i className="fab fa-linkedin-in"></i></a>
                <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            
            <form className="contact-form">
              <input type="text" placeholder="Your Name" className="form-input" />
              <input type="email" placeholder="Your Email" className="form-input" />
              <textarea rows={4} placeholder="Your Message" className="form-textarea"></textarea>
              <button type="submit" className="btn-submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-landing">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <i className="fas fa-briefcase"></i>
                <span>Job<span>Hunt</span></span>
              </div>
              <p>Your trusted partner in career growth and educational opportunities worldwide.</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Platform</h4>
                <a href="#">Find Jobs</a>
                <a href="#">Scholarships</a>
                <a href="#">Companies</a>
                <a href="#">Resources</a>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
                <a href="#">Blog</a>
                <a href="#">Press</a>
              </div>
              <div className="link-group">
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 JobHunt. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          overflow-x: hidden;
        }

        /* Navbar */
        .navbar-landing {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .navbar-landing.scrolled {
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #06b6d4;
          cursor: pointer;
        }

        .logo span:first-child { color: #1e3a8a; }
        .logo span:last-child { color: #06b6d4; }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          background: none;
          border: none;
          color: #334155;
          font-size: 1rem;
          cursor: pointer;
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: #06b6d4;
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-login {
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          color: #06b6d4;
          border: 2px solid #06b6d4;
          transition: all 0.3s;
        }

        .btn-login:hover {
          background: #06b6d4;
          color: white;
        }

        .btn-signup, .btn-dashboard {
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          background: #06b6d4;
          color: white;
          transition: all 0.3s;
        }

        .btn-signup:hover, .btn-dashboard:hover {
          background: #0891b2;
          transform: translateY(-2px);
        }

        /* Hero Section */
        .hero-section {
          padding: 120px 2rem 80px;
          min-height: 90vh;
          display: flex;
          align-items: center;
        }

        .hero-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(6, 182, 212, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          color: #1e3a8a;
          margin-bottom: 1.5rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }

        .hero-description {
          font-size: 1.125rem;
          color: #475569;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-primary-hero {
          padding: 0.875rem 2rem;
          background: #06b6d4;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .btn-primary-hero:hover {
          background: #0891b2;
          transform: translateY(-2px);
        }

        .btn-secondary-hero {
          padding: 0.875rem 2rem;
          background: transparent;
          color: #06b6d4;
          border: 2px solid #06b6d4;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .btn-secondary-hero:hover {
          background: #06b6d4;
          color: white;
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e3a8a;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .hero-illustration {
          position: relative;
          height: 400px;
        }

        .hero-graphic {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          border-radius: 2rem;
          opacity: 0.1;
        }

        .floating-card {
          position: absolute;
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: float 3s ease-in-out infinite;
        }

        .card-1 { top: 10%; left: -10%; animation-delay: 0s; }
        .card-2 { bottom: 20%; right: -10%; animation-delay: 1s; }
        .card-3 { top: 40%; right: 10%; animation-delay: 2s; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        /* Features Section */
        .features-section {
          padding: 80px 2rem;
          background: white;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-tag {
          display: inline-block;
          padding: 0.25rem 1rem;
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          color: #1e3a8a;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: #64748b;
          font-size: 1.125rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2rem;
          background: #f8fafc;
          border-radius: 1rem;
          transition: all 0.3s;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .feature-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .feature-icon i {
          font-size: 2rem;
          color: white;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }

        .feature-card p {
          color: #64748b;
          line-height: 1.6;
        }

        /* How It Works */
        .how-it-works-section {
          padding: 80px 2rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .steps-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .step {
          flex: 1;
          min-width: 250px;
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: #06b6d4;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .step-icon {
          font-size: 3rem;
          color: #06b6d4;
          margin-bottom: 1rem;
        }

        .step h3 {
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }

        .step p {
          color: #64748b;
        }

        .step-arrow {
          font-size: 2rem;
          color: #06b6d4;
        }

        /* Stats Section */
        .stats-section-landing {
          padding: 80px 2rem;
          background: #1e3a8a;
        }

        .stats-grid-landing {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          text-align: center;
        }

        .stat-item-landing {
          color: white;
        }

        .stat-number-landing {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .stat-label-landing {
          font-size: 1rem;
          opacity: 0.9;
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 2rem;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          text-align: center;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          color: white;
          margin-bottom: 1rem;
        }

        .cta-content p {
          color: rgba(255,255,255,0.9);
          margin-bottom: 2rem;
          font-size: 1.125rem;
        }

        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: white;
          color: #06b6d4;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        /* Contact Section */
        .contact-section {
          padding: 80px 2rem;
          background: white;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }

        .contact-info h3 {
          font-size: 1.5rem;
          color: #1e3a8a;
          margin-bottom: 1rem;
        }

        .contact-info p {
          color: #64748b;
          margin-bottom: 2rem;
        }

        .contact-details {
          margin-bottom: 2rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          color: #475569;
        }

        .contact-item i {
          width: 30px;
          color: #06b6d4;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #06b6d4;
          transition: all 0.3s;
        }

        .social-link:hover {
          background: #06b6d4;
          color: white;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-input, .form-textarea {
          padding: 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-family: inherit;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #06b6d4;
        }

        .btn-submit {
          padding: 0.875rem;
          background: #06b6d4;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-submit:hover {
          background: #0891b2;
        }

        /* Footer */
        .footer-landing {
          background: #0f172a;
          color: #94a3b8;
          padding: 4rem 2rem 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 4rem;
          margin-bottom: 3rem;
        }

        .footer-brand .logo {
          margin-bottom: 1rem;
          display: inline-block;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .link-group h4 {
          color: white;
          margin-bottom: 1rem;
        }

        .link-group a {
          display: block;
          color: #94a3b8;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.3s;
        }

        .link-group a:hover {
          color: #06b6d4;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid #1e293b;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .hero-stats {
            justify-content: center;
          }
          
          .nav-links, .nav-buttons {
            display: none;
          }
          
          .steps-container {
            flex-direction: column;
          }
          
          .step-arrow {
            transform: rotate(90deg);
          }
          
          .contact-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-content {
            grid-template-columns: 1fr;
          }
          
          .hero-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
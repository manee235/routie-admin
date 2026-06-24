import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      id: 0,
      title: "Welcome back! Please sign in to your Routie account",
      subtitle: "Real-time fleet tracking, ticketing, and scheduling at your fingertips. Optimize routes, manage bookings, and analyze performance effortlessly.",
      graphic: "sales"
    },
    {
      id: 1,
      title: "Live GPS Map Tracking & Speed Monitoring",
      subtitle: "Monitor active bus locations, speed logs, and routes instantly. Dispatch vehicles, manage routes, and prevent scheduling delays in real time.",
      graphic: "map"
    },
    {
      id: 2,
      title: "Smart Booking Engine & Analytics Hub",
      subtitle: "Generate digital booking slips, view seat allocations, and study monthly revenue graphs to maximize the profitability of your fleet network.",
      graphic: "routes"
    }
  ];

  // Auto slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* ─── LEFT COLUMN: SIGN IN FORM ─── */}
      <div className="login-left-side">
        <div className="login-form-container">
          {/* Logo block */}
          <div className="logo-area">
            <span className="logo-title">Routie <span className="logo-tag">Admin</span></span>
          </div>

          <div className="login-headers">
            <h2>Sign In</h2>
            <p>Welcome back! Please enter your details</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="error-message"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="remember-forgot-row">
              <label className="checkbox-label">
                <input type="checkbox" className="remember-checkbox" />
                <span>Remember for 30 Days</span>
              </label>
              <span className="forgot-link">Forgot password</span>
            </div>

            <button 
              type="submit" 
              className={`login-button ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="spinner"></div>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          <div className="or-divider">
            <span className="divider-line"></span>
            <span className="or-text">OR</span>
            <span className="divider-line"></span>
          </div>

          <div className="social-row">
            <button className="social-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" className="social-logo">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.388 5.388 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.844 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
            <button className="social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" className="social-logo">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Sign up with Facebook</span>
            </button>
          </div>

          <div className="signup-footer">
            Don't have an account? <span className="signup-link">Sign up</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: BLUE SYSTEM SLIDER ─── */}
      <div className="login-right-side">
        <div className="blue-card">
          <div className="slider-wrapper">
            {slides.map((slide, index) => (
              <div key={slide.id} className={`slider-slide ${currentSlide === index ? 'active' : ''}`}>
                <div className="slider-text-content">
                  <h2 className="slider-title">{slide.title}</h2>
                  <p className="slider-subtitle">{slide.subtitle}</p>
                </div>

                <div className="slider-graphic-container">
                  {slide.graphic === "sales" && (
                    <div className="mock-sales-container">
                      <div className="mock-sales-card">
                        <div className="mock-card-header">
                          <h4>Sales Report</h4>
                          <div className="legend-row">
                            <span className="legend-item"><span className="legend-dot blue"></span> Profit</span>
                            <span className="legend-item"><span className="legend-dot gray"></span> Expenses</span>
                          </div>
                        </div>

                        {/* Chart Area */}
                        <div className="mock-chart-bars">
                          {/* Tooltip hovering above August */}
                          <div className="mock-tooltip">
                            <div><span className="dot blue"></span> $89,897</div>
                            <div><span className="dot white"></span> $98,265</div>
                          </div>

                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '70px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '40px' }}></div>
                            </div>
                            <span className="bar-month">Jan</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '80px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '30px' }}></div>
                            </div>
                            <span className="bar-month">Feb</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '65px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '50px' }}></div>
                            </div>
                            <span className="bar-month">Mar</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '85px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '35px' }}></div>
                            </div>
                            <span className="bar-month">Apr</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '75px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '25px' }}></div>
                            </div>
                            <span className="bar-month">May</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '70px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '45px' }}></div>
                            </div>
                            <span className="bar-month">Jun</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '80px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '20px' }}></div>
                            </div>
                            <span className="bar-month">Jul</span>
                          </div>
                          <div className="bar-col active">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '55px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '75px' }}></div>
                            </div>
                            <span className="bar-month">Aug</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '65px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '60px' }}></div>
                            </div>
                            <span className="bar-month">Sep</span>
                          </div>
                          <div className="bar-col">
                            <div className="bar-segment-wrapper">
                              <div className="bar-seg-gray" style={{ height: '50px' }}></div>
                              <div className="bar-seg-blue" style={{ height: '40px' }}></div>
                            </div>
                            <span className="bar-month">Oct</span>
                          </div>
                        </div>
                      </div>

                      {/* Donut overlay card */}
                      <div className="mock-categories-card">
                        <h5>Popular Categories</h5>
                        <div className="donut-area">
                          <svg width="68" height="68" viewBox="0 0 36 36" className="donut-svg">
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(226, 232, 240, 0.4)" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0066FF" strokeWidth="3.5" strokeDasharray="50 50" strokeDashoffset="25" />
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10B981" strokeWidth="3.5" strokeDasharray="30 70" strokeDashoffset="75" />
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#FF7A22" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="105" />
                          </svg>
                          <div className="donut-center">
                            <span className="number">248k</span>
                          </div>
                        </div>
                        <div className="cat-labels">
                          <span className="lbl dot-blue">Mobile</span>
                          <span className="lbl dot-green">Laptop</span>
                          <span className="lbl dot-orange">Electronics</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {slide.graphic === "map" && (
                    <div className="mock-map-container">
                      <div className="mock-map-card">
                        <div className="map-view-header">
                          <h4>Real-Time Fleet Tracker</h4>
                          <span className="live-pill"><span className="pulse"></span> LIVE</span>
                        </div>
                        <div className="mock-map-visual">
                          {/* Map Contour lines grid */}
                          <div className="map-grid-contour"></div>
                          
                          {/* Transit Path Polyline */}
                          <svg className="path-svg">
                            <path d="M 30,120 Q 110,60 190,140 T 310,80" fill="transparent" stroke="var(--primary)" strokeWidth="4" strokeDasharray="6" />
                          </svg>

                          {/* Pin elements */}
                          <div className="map-pin start" style={{ left: '20px', top: '110px' }}></div>
                          <div className="map-pin end" style={{ left: '305px', top: '70px' }}></div>

                          {/* Bus active moving indicator */}
                          <div className="map-bus-marker" style={{ left: '160px', top: '100px' }}>
                            <div className="bus-avatar">🚌</div>
                            <div className="bus-ripple"></div>
                          </div>
                        </div>

                        {/* Overlay info panel inside map */}
                        <div className="map-info-overlay">
                          <div className="stat">
                            <span className="lbl">Active Vehicle</span>
                            <span className="val font-semibold">WP NB-4521</span>
                          </div>
                          <div className="stat">
                            <span className="lbl">Speed</span>
                            <span className="val font-semibold text-green">64 km/h</span>
                          </div>
                          <div className="stat">
                            <span className="lbl">ETA</span>
                            <span className="val font-semibold text-blue">14 Mins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {slide.graphic === "routes" && (
                    <div className="mock-routes-container">
                      <div className="mock-routes-card">
                        <div className="routes-header">
                          <h4>Dispatch Center</h4>
                          <span className="routes-count">3 active streams</span>
                        </div>

                        <div className="routes-list">
                          <div className="route-item">
                            <div className="route-main">
                              <span className="route-no">034</span>
                              <div>
                                <h5>Colombo Fort to Negombo</h5>
                                <p>Intercity AC • WP NB-4521</p>
                              </div>
                            </div>
                            <span className="status-badge green">Active</span>
                          </div>

                          <div className="route-item">
                            <div className="route-main">
                              <span className="route-no">081</span>
                              <div>
                                <h5>Kurunegala to Puttalam</h5>
                                <p>Normal • CP KD-1122</p>
                              </div>
                            </div>
                            <span className="status-badge blue">Scheduled</span>
                          </div>

                          <div className="route-item">
                            <div className="route-main">
                              <span className="route-no">100</span>
                              <div>
                                <h5>Colombo Fort to Panadura</h5>
                                <p>CTB Luxury • SP GA-3344</p>
                              </div>
                            </div>
                            <span className="status-badge orange font-bold">Delayed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dots Pagination Indicators */}
          <div className="slider-dots">
            {slides.map((_, index) => (
              <button 
                key={index} 
                className={`dot-pill ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: #FFFFFF;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
        }

        /* ─── LEFT SIDE ─── */
        .login-left-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #FFFFFF;
          overflow-y: auto;
        }

        .login-form-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          flex-shrink: 0;
        }

        .logo-title {
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -1px;
        }

        .logo-tag {
          color: #0066FF;
        }

        .login-headers h2 {
          font-size: 32px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .login-headers p {
          color: #64748B;
          font-size: 15px;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-message {
          background: #FEF2F2;
          color: #DC2626;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #FEE2E2;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .input-group input {
          width: 100%;
          height: 48px;
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 15px;
          color: #0F172A;
          background: #FFFFFF;
          transition: all 0.2s ease;
        }

        .input-group input::placeholder {
          color: #94A3B8;
        }

        .input-group input:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          padding-right: 48px;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: transparent;
          border: none;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .password-toggle:hover {
          color: #334155;
        }

        .remember-forgot-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          cursor: pointer;
        }

        .remember-checkbox {
          width: 16px !important;
          height: 16px !important;
          border-radius: 4px;
          cursor: pointer;
        }

        .forgot-link {
          color: #0066FF;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #0047B3;
        }

        .login-button {
          height: 48px;
          background: #0066FF;
          color: #FFFFFF;
          border-radius: 10px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.2);
          transition: all 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          filter: brightness(1.05);
          box-shadow: 0 6px 16px rgba(0, 102, 255, 0.3);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .or-divider {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .or-text {
          font-size: 13px;
          font-weight: 700;
          color: #94A3B8;
        }

        .social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .social-btn {
          height: 46px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          transition: all 0.15s ease;
        }

        .social-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .social-logo {
          flex-shrink: 0;
        }

        .signup-footer {
          text-align: center;
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
        }

        .signup-link {
          color: #0F172A;
          font-weight: 700;
          cursor: pointer;
        }

        /* ─── RIGHT SIDE SLIDER ─── */
        .login-right-side {
          flex: 1.1;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .blue-card {
          width: 100%;
          height: 100%;
          max-height: 800px;
          background: #2563EB;
          background-image: radial-gradient(circle at top left, #3B82F6 0%, #1D4ED8 100%);
          border-radius: 28px;
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.2);
          color: #FFFFFF;
        }

        .slider-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .slider-slide {
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .slider-slide.active {
          opacity: 1;
          transform: translateY(0);
          position: relative;
          pointer-events: auto;
        }

        .slider-text-content {
          margin-bottom: 24px;
        }

        .slider-title {
          font-size: 38px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -1px;
          line-height: 1.2;
          margin-bottom: 16px;
        }

        .slider-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 15px;
          line-height: 1.6;
          max-width: 580px;
          font-weight: 400;
        }

        .slider-graphic-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
        }

        /* Mock Sales Graphics styles */
        .mock-sales-container {
          display: flex;
          gap: 20px;
          width: 100%;
          max-width: 540px;
          position: relative;
          align-items: flex-end;
        }

        .mock-sales-card {
          flex: 1.5;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 20px 24px;
          color: #0F172A;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .mock-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .mock-card-header h4 {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }

        .legend-row {
          display: flex;
          gap: 12px;
        }

        .legend-item {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .legend-dot.blue { background: #0066FF; }
        .legend-dot.gray { background: #E2E8F0; }

        .mock-chart-bars {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 130px;
          padding-top: 10px;
          position: relative;
        }

        .bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .bar-segment-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          width: 8px;
          height: 100px;
          background: #F1F5F9;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-seg-gray {
          width: 100%;
          background: #E2E8F0;
        }

        .bar-seg-blue {
          width: 100%;
          background: #0066FF;
        }

        .bar-col.active .bar-seg-blue {
          background: #3B82F6;
        }

        .bar-month {
          font-size: 9px;
          font-weight: 600;
          color: #94A3B8;
        }

        .mock-tooltip {
          position: absolute;
          top: -24px;
          left: 62%;
          background: #0F172A;
          color: #FFFFFF;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 9px;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          gap: 3px;
          z-index: 10;
        }

        .mock-tooltip::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px 4px 0;
          border-style: solid;
          border-color: #0F172A transparent;
        }

        .mock-tooltip .dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          margin-right: 4px;
        }

        .mock-tooltip .dot.blue { background: #0066FF; }
        .mock-tooltip .dot.white { background: #FFFFFF; }

        .mock-categories-card {
          width: 130px;
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px;
          color: #0F172A;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
          position: absolute;
          right: -25px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          z-index: 5;
        }

        .mock-categories-card h5 {
          font-size: 10px;
          font-weight: 700;
          color: #0F172A;
          text-align: center;
        }

        .donut-area {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-center .number {
          font-size: 11px;
          font-weight: 800;
          color: #0F172A;
        }

        .cat-labels {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .cat-labels .lbl {
          font-size: 8px;
          font-weight: 600;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cat-labels .lbl::before {
          content: '';
          width: 4px;
          height: 4px;
          border-radius: 50%;
          display: inline-block;
        }

        .cat-labels .lbl.dot-blue::before { background: #0066FF; }
        .cat-labels .lbl.dot-green::before { background: #10B981; }
        .cat-labels .lbl.dot-orange::before { background: #FF7A22; }

        /* Map Mockup style */
        .mock-map-container {
          width: 100%;
          max-width: 480px;
        }

        .mock-map-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 20px;
          color: #0F172A;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .map-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .map-view-header h4 {
          font-size: 14px;
          font-weight: 700;
        }

        .live-pill {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          animation: mapPulse 1.5s infinite;
        }

        @keyframes mapPulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(0.9); opacity: 1; }
        }

        .mock-map-visual {
          height: 150px;
          background: #F1F5F9;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          border: 1px solid #E2E8F0;
        }

        .map-grid-contour {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle, #CBD5E1 1px, transparent 1px),
            radial-gradient(circle, #CBD5E1 1px, transparent 1px);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
          opacity: 0.4;
        }

        .path-svg {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .map-pin {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .map-pin.start {
          background: #10B981;
        }

        .map-pin.end {
          background: #0066FF;
        }

        .map-bus-marker {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0066FF;
          border: 2.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 102, 255, 0.4);
          z-index: 5;
        }

        .bus-avatar {
          font-size: 13px;
        }

        .bus-ripple {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid #0066FF;
          opacity: 0.5;
          animation: ripple 2s infinite;
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .map-info-overlay {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
          background: #F8FAFC;
          border-radius: 10px;
          padding: 10px 14px;
          border: 1px solid #E2E8F0;
        }

        .map-info-overlay .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .map-info-overlay .lbl {
          font-size: 8px;
          color: #94A3B8;
          text-transform: uppercase;
          font-weight: 700;
        }

        .map-info-overlay .val {
          font-size: 11px;
          font-weight: 700;
          color: #0F172A;
        }

        .map-info-overlay .val.text-green { color: #10B981; }
        .map-info-overlay .val.text-blue { color: #0066FF; }

        /* Routes Dispatch mockup style */
        .mock-routes-container {
          width: 100%;
          max-width: 480px;
        }

        .mock-routes-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 20px;
          color: #0F172A;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .routes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .routes-header h4 {
          font-size: 14px;
          font-weight: 700;
        }

        .routes-count {
          font-size: 10px;
          color: #64748B;
          font-weight: 600;
        }

        .routes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .route-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .route-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .route-no {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #E8F0FE;
          color: #0066FF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .route-main h5 {
          font-size: 11px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .route-main p {
          font-size: 9px;
          color: #94A3B8;
          font-weight: 500;
        }

        .status-badge {
          font-size: 8px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .status-badge.green { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .status-badge.blue { background: rgba(0, 102, 255, 0.12); color: #0066FF; }
        .status-badge.orange { background: rgba(255, 122, 34, 0.12); color: #FF7A22; }

        .slider-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
        }

        .dot-pill {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dot-pill.active {
          width: 24px;
          border-radius: 4px;
          background: #FFFFFF;
        }

        /* ─── RESPONSIVE STYLES ─── */
        @media (max-width: 1023px) {
          .login-right-side {
            display: none;
          }
          .login-left-side {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;

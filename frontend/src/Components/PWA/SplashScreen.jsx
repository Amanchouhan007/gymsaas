import React, { useState, useEffect } from 'react';
import Logo from '../../assets/Logo/logo.png';

const SplashScreen = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Show splash screen for 1.4s then trigger smooth fade out
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1200);

    const timer2 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className="splash-screen-container position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
      style={{
        zIndex: 99999,
        background: 'linear-gradient(135deg, #0d0401 0%, #170803 50%, #240d05 100%)',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fade ? 'none' : 'auto',
      }}
    >
      <style>
        {`
          @keyframes pulseGlow {
            0% {
              transform: scale(1);
              filter: drop-shadow(0 0 15px rgba(234, 88, 12, 0.4));
            }
            50% {
              transform: scale(1.08);
              filter: drop-shadow(0 0 30px rgba(234, 88, 12, 0.8));
            }
            100% {
              transform: scale(1);
              filter: drop-shadow(0 0 15px rgba(234, 88, 12, 0.4));
            }
          }
          @keyframes shimmerBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .splash-logo {
            animation: pulseGlow 2s infinite ease-in-out;
            width: 90px;
            height: 90px;
            object-fit: contain;
          }
          .splash-bar-inner {
            animation: shimmerBar 1.2s infinite ease-in-out;
          }
        `}
      </style>

      <div className="d-flex flex-column align-items-center text-center px-4">
        {/* Logo */}
        <div className="mb-3 position-relative">
          <img src={Logo} alt="Gym Logo" className="splash-logo" />
        </div>

        {/* Title */}
        <h2
          className="fw-bold tracking-wide mb-1"
          style={{
            fontSize: '1.4rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #fed7aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Gym Management
        </h2>
        <span
          className="fw-medium mb-4"
          style={{ fontSize: '0.85rem', color: '#ea580c', letterSpacing: '0.5px' }}
        >
          POWERING FIT BUSINESSES
        </span>

        {/* Shimmer Loader */}
        <div
          className="rounded-pill overflow-hidden position-relative mt-2"
          style={{
            width: '140px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="splash-bar-inner h-100 w-100 position-absolute top-0 start-0"
            style={{
              background: 'linear-gradient(90deg, transparent, #ea580c, #f97316, transparent)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

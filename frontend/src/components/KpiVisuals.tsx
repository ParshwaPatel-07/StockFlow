import React from 'react';
import { handleImageError } from '../utils/productImages';

// 3D Studio Headphones Floating Asset (Card 1)
export const KpiHeadphonesAsset: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
    <img
      src="/assets/products/aud-anc-04.svg"
      alt="Headphones"
      onError={handleImageError}
      className="w-20 h-20 object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.18)] transform -rotate-12 hover:rotate-0 transition-transform duration-500 rounded-xl"
    />
  </div>
);

// Glowing Translucent Blue 3D Isometric Cube (Card 2)
export const KpiGlowingCubeAsset: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-20 h-20 filter drop-shadow-[0_8px_20px_rgba(56,189,248,0.45)]">
      <defs>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="cubeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Ambient Back Glow */}
      <ellipse cx="50" cy="50" rx="35" ry="30" fill="url(#cubeGlow)" />
      
      {/* 3D Isometric Cube Faces */}
      {/* Top Face */}
      <polygon points="50,18 80,34 50,50 20,34" fill="url(#cubeTop)" stroke="#e0f2fe" strokeWidth="1" strokeLinejoin="round" />
      {/* Left Face */}
      <polygon points="20,34 50,50 50,82 20,66" fill="url(#cubeLeft)" stroke="#38bdf8" strokeWidth="1" strokeLinejoin="round" />
      {/* Right Face */}
      <polygon points="50,50 80,34 80,66 50,82" fill="url(#cubeRight)" stroke="#7dd3fc" strokeWidth="1" strokeLinejoin="round" />
      
      {/* Inner Highlight Refraction Lines */}
      <path d="M 50 22 L 76 35 L 50 47 L 24 35 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.75" />
      <line x1="50" y1="50" x2="50" y2="82" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  </div>
);

// Translucent Geometric 3D Storage Crate (Card 3)
export const KpiStorageCrateAsset: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-20 h-20 filter drop-shadow-[0_8px_16px_rgba(148,163,184,0.35)]">
      <defs>
        <linearGradient id="crateTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="crateLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="crateRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Top Face */}
      <polygon points="50,22 78,36 50,50 22,36" fill="url(#crateTop)" stroke="#cbd5e1" strokeWidth="1" />
      {/* Left Face */}
      <polygon points="22,36 50,50 50,78 22,64" fill="url(#crateLeft)" stroke="#94a3b8" strokeWidth="1" />
      {/* Right Face */}
      <polygon points="50,50 78,36 78,64 50,78" fill="url(#crateRight)" stroke="#cbd5e1" strokeWidth="1" />
      
      {/* Crate Ribs / Grid Slats */}
      <line x1="36" y1="43" x2="36" y2="71" stroke="#475569" strokeWidth="1.2" />
      <line x1="64" y1="43" x2="64" y2="71" stroke="#64748b" strokeWidth="1.2" />
      <line x1="22" y1="50" x2="50" y2="64" stroke="#475569" strokeWidth="1" />
      <line x1="50" y1="64" x2="78" y2="50" stroke="#64748b" strokeWidth="1" />
    </svg>
  </div>
);

// 3D Delivery Parcel / Package (Card 4)
export const KpiParcelAsset: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-20 h-20 filter drop-shadow-[0_8px_16px_rgba(203,213,225,0.45)]">
      <defs>
        <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="tapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Box Faces */}
      <polygon points="50,20 80,35 50,50 20,35" fill="url(#boxTop)" stroke="#e2e8f0" strokeWidth="0.8" />
      <polygon points="20,35 50,50 50,80 20,65" fill="url(#boxLeft)" stroke="#94a3b8" strokeWidth="0.8" />
      <polygon points="50,50 80,35 80,65 50,80" fill="url(#boxRight)" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Package Tape Strip Across */}
      <polygon points="45,22.5 55,27.5 55,47.5 45,42.5" fill="url(#tapeGradient)" />
      <polygon points="45,42.5 55,47.5 55,77.5 45,72.5" fill="url(#tapeGradient)" />
    </svg>
  </div>
);

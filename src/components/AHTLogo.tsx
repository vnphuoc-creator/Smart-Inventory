import React from 'react';

interface AHTLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
}

export const AHTLogo: React.FC<AHTLogoProps> = ({ className = 'h-8', variant = 'full' }) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg
        viewBox="0 0 240 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Letter A */}
        <path
          d="M10 60 L32 10 L54 60 H40 L32 40 L24 60 Z"
          fill="#3b82f6"
          className="dark:fill-blue-400 fill-blue-600"
        />
        <polygon
          points="27,33 32,20 37,33"
          fill="#0f172a"
          className="dark:fill-slate-900 fill-white"
        />

        {/* Letter H */}
        <path
          d="M62 10 H75 V30 H95 V10 H108 V60 H95 V41 H75 V60 H62 Z"
          fill="#6366f1"
          className="dark:fill-indigo-400 fill-indigo-600"
        />

        {/* Letter T */}
        <path
          d="M115 10 H155 V21 H141 V60 H128 V21 H115 Z"
          fill="#818cf8"
          className="dark:fill-indigo-300 fill-indigo-700"
        />

        {/* Dynamic AHT Curved Wings Symbol */}
        {/* Top Wing - Teal */}
        <path
          d="M190 8 C175 14 170 28 178 30 C194 30 205 18 228 22 C210 14 198 10 190 8 Z"
          fill="#2dd4bf"
        />
        {/* Middle Wing - Purple / Indigo */}
        <path
          d="M172 16 C158 22 154 34 163 36 C178 36 188 25 210 28 C192 21 180 18 172 16 Z"
          fill="#818cf8"
        />
        {/* Bottom Sweeping Wing - Deep Navy */}
        <path
          d="M182 45 C198 42 208 32 232 30 C206 32 192 48 168 58 H186 C194 53 188 47 182 45 Z"
          fill="#6366f1"
        />
      </svg>
    </div>
  );
};

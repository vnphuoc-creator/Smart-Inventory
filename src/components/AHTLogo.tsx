import React from 'react';

interface AHTLogoProps {
  className?: string;
  showPlane?: boolean;
}

export const AHTLogo: React.FC<AHTLogoProps> = ({ className = 'h-8', showPlane = true }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Clean White Pill Container matching official brand specifications */}
      <div className="bg-white rounded-lg px-2.5 py-1 shadow-sm flex items-center justify-center border border-white/30 h-full">
        <svg
          viewBox="0 0 130 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-auto"
        >
          {/* Letter 'A' (Stylized Lambda shape) */}
          <path
            d="M5 38 L17 8 L24 8 L36 38 L28.5 38 L20.5 17.5 L12.5 38 Z"
            fill="#1E2260"
          />

          {/* Letter 'H' */}
          <path
            d="M42 8 L49.5 8 L49.5 20.5 L60.5 20.5 L60.5 8 L68 8 L68 38 L60.5 38 L60.5 26.5 L49.5 26.5 L49.5 38 L42 38 Z"
            fill="#1E2260"
          />

          {/* Letter 'T' */}
          <path
            d="M74 8 L98 8 L98 14.5 L89.5 14.5 L89.5 38 L82.5 38 L82.5 14.5 L74 14.5 Z"
            fill="#1E2260"
          />

          {/* Top Teal/Cyan Wing Swoosh */}
          <path
            d="M98 13.5 C104 11.5, 114 10.5, 122 5.5 C116 8.5, 108 10.5, 101 12 Z"
            fill="#00A3A6"
          />
          <path
            d="M102 12 C108 10, 117 9, 124 5 C118 8, 109 10.5, 103 13.5 Z"
            fill="#00B4B7"
          />

          {/* Bottom Purple/Violet Wing Swoosh */}
          <path
            d="M99 17 C106 17, 115 15, 122 10.5 C115 13.5, 107 14.5, 100 15 Z"
            fill="#5D2A88"
          />
          <path
            d="M101 19 C107 18, 116 16, 121 12 C114 15, 106 16.5, 101 18.5 Z"
            fill="#7B3294"
          />
        </svg>
      </div>

      {/* Stylized Ascending Airplane (Matching Reference Header) */}
      {showPlane && (
        <div className="relative -ml-1 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
          <svg
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 drop-shadow-md transform -rotate-12 hover:scale-105 transition-transform"
          >
            {/* Airplane Fuselage */}
            <path
              d="M22 4 C24 4, 26 7, 26 12 L26 24 L39 30 L39 33 L26 28 L26 36 L30 39 L30 41 L22 39.5 L14 41 L14 39 L18 36 L18 28 L5 33 L5 30 L18 24 L18 12 C18 7, 20 4, 22 4 Z"
              fill="#E2E8F0"
            />
            {/* Blue accent stripe & cockpit */}
            <path
              d="M22 6 C23 6, 24 7.5, 24 10 L24 24 L20 24 L20 10 C20 7.5, 21 6, 22 6 Z"
              fill="#3B82F6"
            />
            <path
              d="M21 8 L23 8 L23 10 L21 10 Z"
              fill="#1E293B"
            />
            {/* Wing tips */}
            <path d="M5 30 L8 28 L8 31 Z" fill="#2563EB" />
            <path d="M39 30 L36 28 L36 31 Z" fill="#2563EB" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AHTLogo;

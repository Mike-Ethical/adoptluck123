import React from 'react';

interface BloxLuckLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BloxLuckLogo: React.FC<BloxLuckLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeConfig = {
    sm: {
      text: 'text-lg',
      swords: 'w-6 h-6',
      gap: 'gap-1.5',
    },
    md: {
      text: 'text-2xl sm:text-3xl',
      swords: 'w-8 h-8 sm:w-9 sm:h-9',
      gap: 'gap-2',
    },
    lg: {
      text: 'text-4xl sm:text-5xl',
      swords: 'w-13 h-13 sm:w-16 sm:h-16',
      gap: 'gap-3',
    },
    xl: {
      text: 'text-6xl sm:text-7xl',
      swords: 'w-20 h-20 sm:w-24 sm:h-24',
      gap: 'gap-4',
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center select-none font-sans font-black tracking-normal ${sizeConfig.gap} ${className}`}
      title="AdoptLuck"
    >
      {/* "Adopt" text */}
      <span
        className={`${sizeConfig.text} font-black text-white leading-none tracking-tight filter drop-shadow-[0_0_12px_rgba(56,132,255,0.7)]`}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Fredoka", "Nunito", sans-serif',
        }}
      >
        Adopt
      </span>

      {/* Crossed Electric Blue Swords Icon */}
      <div
        className={`${sizeConfig.swords} shrink-0 relative flex items-center justify-center filter drop-shadow-[0_0_16px_rgba(56,132,255,0.9)]`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Sword 1: Top-Left to Bottom-Right (\) */}
          <g transform="translate(50,50) rotate(45) translate(-50,-50)">
            {/* Blade */}
            <path
              d="M 43 14 L 50 4 L 57 14 L 57 62 L 43 62 Z"
              fill="#3884ff"
            />
            {/* Guard */}
            <rect
              x="34"
              y="62"
              width="32"
              height="8"
              rx="2.5"
              fill="#3884ff"
            />
            {/* Grip */}
            <rect
              x="46"
              y="70"
              width="8"
              height="16"
              fill="#2563eb"
            />
            {/* Pommel */}
            <rect
              x="43"
              y="86"
              width="14"
              height="7"
              rx="2"
              fill="#3884ff"
            />
          </g>

          {/* Sword 2: Top-Right to Bottom-Left (/) */}
          <g transform="translate(50,50) rotate(-45) translate(-50,-50)">
            {/* Blade */}
            <path
              d="M 43 14 L 50 4 L 57 14 L 57 62 L 43 62 Z"
              fill="#3884ff"
            />
            {/* Guard */}
            <rect
              x="34"
              y="62"
              width="32"
              height="8"
              rx="2.5"
              fill="#3884ff"
            />
            {/* Grip */}
            <rect
              x="46"
              y="70"
              width="8"
              height="16"
              fill="#2563eb"
            />
            {/* Pommel */}
            <rect
              x="43"
              y="86"
              width="14"
              height="7"
              rx="2"
              fill="#3884ff"
            />
          </g>
        </svg>
      </div>

      {/* "Luck" text */}
      <span
        className={`${sizeConfig.text} font-black text-white leading-none tracking-tight filter drop-shadow-[0_0_12px_rgba(56,132,255,0.7)]`}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Fredoka", "Nunito", sans-serif',
        }}
      >
        Luck
      </span>
    </div>
  );
};

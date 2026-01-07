
import React from 'react';
import { TON_BARBER_LOGO_BASE64 } from '../constants';

interface LogoProps {
  size?: number;
  className?: string;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ 
        width: size, 
        height: size,
      }}
    >
      <img
        src={TON_BARBER_LOGO_BASE64}
        alt="Logo da Barbearia"
        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
        style={{
          boxShadow: `0 2px 10px rgba(0, 0, 0, 0.2), 0 0 20px var(--color-primary-hover)`,
        }}
      />
    </div>
  );
};

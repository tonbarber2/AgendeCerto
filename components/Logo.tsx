import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  inverted?: boolean; // Se true, fundo branco e texto colorido (para headers coloridos)
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "", inverted = false }) => {
  return (
    <div 
        className={`relative flex items-center justify-center font-black leading-none select-none rounded-xl shadow-lg transition-transform hover:scale-105 ${className}`}
        style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.45,
            background: inverted ? 'white' : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: inverted ? 'var(--color-primary)' : 'white'
        }}
    >
        <div className="flex items-center justify-center tracking-tighter">
            <span>A</span>
            <span className="opacity-90">C</span>
        </div>
    </div>
  );
};
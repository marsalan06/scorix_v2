import React from 'react';
import { X, Check } from 'lucide-react';

interface ScorixLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ScorixLogo: React.FC<ScorixLogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} bg-white rounded-full flex items-center justify-center`}>
        <div className="relative">
          <X className="w-3/4 h-3/4 text-dark-950" />
          <Check className="w-1/2 h-1/2 text-dark-950 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-bold text-white`}>
          Scorix
        </span>
      )}
    </div>
  );
};

export default ScorixLogo;

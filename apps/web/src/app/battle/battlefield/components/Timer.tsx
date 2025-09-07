import React from 'react';

interface TimerProps {
  timeRemaining: number; // in seconds
  maxTime: number; // maximum time in seconds
}

export function Timer({ timeRemaining, maxTime }: TimerProps) {
  const timePercentage = (timeRemaining / maxTime) * 100;
  
  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50">
      <div className="relative w-32 h-16">
        {/* Bottom Half Circle Background */}
        <div className="absolute top-0 w-32 h-16 rounded-b-full border-2 border-gray-600/50 overflow-hidden">
          {/* Timer Progress Arc */}
          <div className="absolute inset-0 rounded-b-full overflow-hidden">
            <div 
              className="absolute top-0 w-full bg-black/60 backdrop-blur-sm rounded-b-full transition-all duration-1000 ease-linear"
              style={{ 
                height: `${timePercentage}%`,
                transformOrigin: 'top center'
              }}
            />
          </div>
          
          {/* Timer Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {Math.ceil(timeRemaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


import React from 'react';

export const Watermark = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[-1] hidden md:block"
    >
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center"
        style={{
          opacity: 0.04,
          backgroundImage: 'url("/icon-512x512.png")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
          filter: 'grayscale(30%)',
        }}
      />
    </div>
  );
};

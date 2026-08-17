import React from 'react';

export const TopProgressBar = ({ isLoading, progress }) => {
  if (!isLoading && progress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        zIndex: 999999,
        background: 'rgba(139, 92, 246, 0.15)',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #10b981 100%)',
          boxShadow: '0 0 12px #8b5cf6, 0 0 6px #ec4899',
          transition: progress >= 100 ? 'width 0.1s ease-out, opacity 0.3s ease-out' : 'width 0.2s ease-in-out'
        }}
      />
    </div>
  );
};

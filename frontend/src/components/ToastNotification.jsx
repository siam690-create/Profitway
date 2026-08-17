import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: '12px',
        background: isSuccess 
          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
          : isError 
            ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' 
            : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(8px)',
        fontWeight: '600',
        fontSize: '13px',
        maxWidth: '380px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {isSuccess && <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
      {isError && <AlertCircle size={18} style={{ flexShrink: 0 }} />}
      {!isSuccess && !isError && <Info size={18} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1, lineHeight: '1.4' }}>{toast.text}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.85
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};

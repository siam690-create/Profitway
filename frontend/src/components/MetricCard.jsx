import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badgeText }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', iconColor: '#10b981' };
      case 'rose':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', iconColor: '#ef4444' };
      case 'amber':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', iconColor: '#f59e0b' };
      case 'blue':
        return { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', iconColor: '#3b82f6' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', iconColor: '#6366f1' };
    }
  };

  const colors = getColorStyles();

  return (
    <div className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{title}</span>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon size={20} color={colors.iconColor} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</h2>
        {badgeText && (
          <span className="badge badge-info" style={{ fontSize: '11px' }}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

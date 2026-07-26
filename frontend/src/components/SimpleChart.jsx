import React from 'react';

export const SimpleChart = ({ data = [], currency = '৳' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No sales chart data available for the selected period.
      </div>
    );
  }

  // Find max value for chart scaling
  const maxVal = Math.max(
    ...data.map(d => Math.max(Number(d.sales || 0), Number(d.gross_profit || 0), Number(d.net_profit || 0))),
    1000
  );

  const chartHeight = 180;
  const padding = 20;

  return (
    <div style={{ width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '12px', fontWeight: '600' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Sales Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Gross Profit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Net Profit</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: `${chartHeight}px`, paddingTop: '10px' }}>
        {data.map((item, idx) => {
          const salesH = (Number(item.sales || 0) / maxVal) * (chartHeight - padding);
          const grossH = (Number(item.gross_profit || 0) / maxVal) * (chartHeight - padding);
          const netH = Math.max(0, (Number(item.net_profit || 0) / maxVal) * (chartHeight - padding));

          const dateLabel = item.date_label ? item.date_label.slice(5) : `Day ${idx + 1}`;

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                {/* Sales Bar */}
                <div 
                  title={`Sales: ${currency}${Number(item.sales || 0).toLocaleString()}`}
                  style={{
                    width: '30%',
                    maxWidth: '18px',
                    height: `${Math.max(4, salesH)}px`,
                    background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
                {/* Gross Profit Bar */}
                <div 
                  title={`Gross Profit: ${currency}${Number(item.gross_profit || 0).toLocaleString()}`}
                  style={{
                    width: '30%',
                    maxWidth: '18px',
                    height: `${Math.max(4, grossH)}px`,
                    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
                {/* Net Profit Bar */}
                <div 
                  title={`Net Profit: ${currency}${Number(item.net_profit || 0).toLocaleString()}`}
                  style={{
                    width: '30%',
                    maxWidth: '18px',
                    height: `${Math.max(4, netH)}px`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{dateLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

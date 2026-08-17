import React, { useState } from 'react';

export const DateRangeFilter = ({ onFilterChange, initialRange = 'all' }) => {
  const [range, setRange] = useState(initialRange);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateLocal = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDatesForRange = (selectedRange, customStart = '', customEnd = '') => {
    const now = new Date();
    let start = '';
    let end = '';

    if (selectedRange === 'today') {
      start = formatDateLocal(now);
      end = start;
    } else if (selectedRange === 'week') {
      const temp = new Date();
      const firstDay = new Date(temp.setDate(temp.getDate() - temp.getDay()));
      start = formatDateLocal(firstDay);
      end = formatDateLocal(now);
    } else if (selectedRange === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = formatDateLocal(firstDay);
      end = formatDateLocal(now);
    } else if (selectedRange === 'custom') {
      start = customStart;
      end = customEnd;
    } else {
      // All Time
      start = '';
      end = '';
    }

    return { range: selectedRange, startDate: start, endDate: end };
  };

  const handleRangeClick = (selectedRange) => {
    setRange(selectedRange);
    if (selectedRange !== 'custom') {
      const dates = calculateDatesForRange(selectedRange);
      onFilterChange(dates);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert('Select both Start Date and End Date');
    const dates = calculateDatesForRange('custom', startDate, endDate);
    onFilterChange(dates);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => handleRangeClick('today')}
          className={`btn btn-sm ${range === 'today' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => handleRangeClick('week')}
          className={`btn btn-sm ${range === 'week' ? 'btn-primary' : 'btn-secondary'}`}
        >
          This Week
        </button>

        <button
          type="button"
          onClick={() => handleRangeClick('month')}
          className={`btn btn-sm ${range === 'month' ? 'btn-primary' : 'btn-secondary'}`}
        >
          This Month
        </button>

        <button
          type="button"
          onClick={() => handleRangeClick('all')}
          className={`btn btn-sm ${range === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Time
        </button>

        <button
          type="button"
          onClick={() => handleRangeClick('custom')}
          className={`btn btn-sm ${range === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Custom Date
        </button>
      </div>

      {range === 'custom' && (
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Apply Date Filter
          </button>
        </form>
      )}
    </div>
  );
};

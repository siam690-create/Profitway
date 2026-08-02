import React, { useState } from 'react';

export const DateRangeFilter = ({ onFilterChange, initialRange = 'all' }) => {
  const [range, setRange] = useState(initialRange);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const calculateDatesForRange = (selectedRange, customStart = '', customEnd = '') => {
    const now = new Date();
    let start = '';
    let end = '';

    if (selectedRange === 'today') {
      start = now.toISOString().slice(0, 10);
      end = start;
    } else if (selectedRange === 'week') {
      const temp = new Date();
      const firstDay = new Date(temp.setDate(temp.getDate() - temp.getDay()));
      start = firstDay.toISOString().slice(0, 10);
      end = new Date().toISOString().slice(0, 10);
    } else if (selectedRange === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = firstDay.toISOString().slice(0, 10);
      end = new Date().toISOString().slice(0, 10);
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
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 10px', fontSize: '13px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 10px', fontSize: '13px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
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

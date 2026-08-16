import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronDown, Check } from 'lucide-react';

/**
 * ResponsiveSubTabs Component
 * - Prevents double-line text wrapping (white-space: nowrap)
 * - Auto-collapses items from right into a Three-Tier Navigation Menu (☰ More) as screen shrinks
 * - On Mobile (screens < 768px), collapses ALL items into the Three-Tier Navigation Menu
 */
export const ResponsiveSubTabs = ({ tabs = [], activeTab, onSelectTab, extraActions }) => {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(tabs.length);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Responsive calculation logic
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width < 768) {
        setVisibleCount(0); // All items go into More Menu on mobile
        return;
      }

      // Responsive threshold calculation based on container width
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;

        // Reserve space for "More" button (~130px) and use realistic tab width (~165px) so 1-2 extra tabs go into More menu
        const avgTabWidth = 165;
        const reservedSpace = 130;
        const availableSpace = containerWidth - reservedSpace;
        const maxVisible = Math.max(1, Math.floor(availableSpace / avgTabWidth));

        if (maxVisible >= tabs.length) {
          setVisibleCount(tabs.length);
        } else {
          setVisibleCount(maxVisible);
        }
      }
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);

    const observer = new ResizeObserver(checkResponsive);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', checkResponsive);
      observer.disconnect();
    };
  }, [tabs.length]);

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const visibleTabs = isMobile ? [] : tabs.slice(0, visibleCount);
  const hiddenTabs = isMobile ? tabs : tabs.slice(visibleCount);
  const activeInHidden = hiddenTabs.some(t => t.id === activeTab);

  return (
    <div 
      ref={containerRef} 
      className="responsive-subtabs-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        marginBottom: '20px',
        position: 'relative',
        width: '100%'
      }}
    >
      {/* 📱 MOBILE VIEW: Three-Tier Navigation Menu Button */}
      {isMobile ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Menu size={18} />
              <span>More: {activeTabObj ? activeTabObj.label : 'Select View'}</span>
            </div>
            <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {/* Mobile Full Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                zIndex: 1000,
                overflow: 'hidden',
                padding: '8px',
                animation: 'slideUp 0.2s ease'
              }}
            >
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(tab.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {Icon && <Icon size={16} />}
                      <span>{tab.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tab.badge && (
                        <span className={`badge ${tab.badgeType === 'warning' ? 'badge-warning' : 'badge-success'}`}>
                          {tab.badge}
                        </span>
                      )}
                      {isActive && <Check size={16} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 💻 DESKTOP & TABLET VIEW: Visible Tabs + Three-Tier Overflow Menu */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: 'clamp(11px, 1.1vw, 13.5px)',
                  padding: '8px 14px',
                  fontWeight: isActive ? '700' : '600',
                  flexShrink: 0
                }}
              >
                {Icon && <Icon size={15} />}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`badge ${tab.badgeType === 'warning' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Overflow Dropdown Button (☰ More) */}
          {hiddenTabs.length > 0 && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`btn ${activeInHidden ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: 'clamp(11px, 1.1vw, 13.5px)',
                  padding: '8px 14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  background: activeInHidden ? 'var(--accent-gradient)' : 'var(--bg-secondary)'
                }}
              >
                <Menu size={16} />
                <span>More ({hiddenTabs.length})</span>
                <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: '220px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    padding: '8px',
                    animation: 'slideUp 0.2s ease'
                  }}
                >
                  {hiddenTabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(tab.id);
                          setDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                          color: isActive ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: isActive ? '700' : '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          marginBottom: '2px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {Icon && <Icon size={14} />}
                          <span>{tab.label}</span>
                        </div>

                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extra Action Buttons if provided */}
      {extraActions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {extraActions}
        </div>
      )}
    </div>
  );
};

export default ResponsiveSubTabs;

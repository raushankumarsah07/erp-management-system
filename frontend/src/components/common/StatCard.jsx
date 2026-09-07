import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#2563eb', subtitle, trend }) => {
  return (
    <div className="erp-stat-card h-100">
      <div className="d-flex flex-column justify-content-between h-100 flex-grow-1">
        <div>
          <span className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#64748b' }}>
            {title}
          </span>
          <h3 className="fw-bold my-1 text-dark" style={{ letterSpacing: '-0.02em' }}>
            {value}
          </h3>
        </div>
        {(subtitle || trend) && (
          <div className="d-flex align-items-center gap-1 mt-2" style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {trend && (
              <span className={`fw-semibold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
      {Icon && (
        <div
          className="stat-icon-wrapper ms-3 flex-shrink-0"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;

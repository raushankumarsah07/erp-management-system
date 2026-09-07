import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User as UserIcon, Shield, Bell } from 'lucide-react';

const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'sales':
        return 'primary';
      case 'purchase':
        return 'info';
      case 'inventory':
        return 'warning';
      case 'finance':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="erp-topbar">
      <div className="d-flex align-items-center gap-3">
        <Button
          variant="light"
          size="sm"
          className="border d-flex align-items-center justify-content-center p-2 rounded-2 text-secondary"
          onClick={onToggleSidebar}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </Button>
        <span className="fw-semibold text-secondary small d-none d-md-inline">
          Connected Database: <span className="text-dark fw-bold">Local MongoDB (127.0.0.1:27017)</span>
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Role Pill */}
        {user && (
          <span
            className={`badge bg-${getRoleBadgeVariant(user.role)} text-uppercase px-2.5 py-1.5`}
            style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}
          >
            <Shield size={12} className="me-1 mb-0.5" />
            {user.role}
          </span>
        )}

        {/* User Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            id="user-menu-dropdown"
            className="d-flex align-items-center gap-2 border bg-white py-1.5 px-2.5 rounded-pill shadow-sm"
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="fw-medium text-dark small text-truncate d-none d-sm-inline" style={{ maxWidth: '140px' }}>
              {user?.name || 'User'}
            </span>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-lg border-0 rounded-3 mt-2 py-2" style={{ minWidth: '220px' }}>
            <div className="px-3 py-2 border-bottom">
              <p className="mb-0 fw-bold text-dark small">{user?.name}</p>
              <p className="mb-0 text-muted small text-truncate">{user?.email}</p>
              <small className="text-secondary">{user?.department || 'Department'}</small>
            </div>
            <Dropdown.Item onClick={logout} className="text-danger py-2 mt-1 d-flex align-items-center gap-2">
              <LogOut size={16} />
              <span>Sign Out</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopNavbar;

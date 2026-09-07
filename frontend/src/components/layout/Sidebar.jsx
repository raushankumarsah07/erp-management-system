import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  ShoppingCart,
  Truck,
  FileCheck,
  FileText,
  ShieldCheck,
  Code2,
  Layers,
} from 'lucide-react';

const Sidebar = ({ collapsed }) => {
  const { user, isAdmin, hasRole } = useAuth();

  const navItems = [
    {
      section: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'purchase', 'inventory', 'finance'] },
      ],
    },
    {
      section: 'Inventory & Catalog',
      items: [
        { path: '/products', label: 'Products', icon: Package, roles: ['admin', 'sales', 'purchase', 'inventory'] },
      ],
    },
    {
      section: 'Partners',
      items: [
        { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'sales', 'finance'] },
        { path: '/suppliers', label: 'Suppliers', icon: Building2, roles: ['admin', 'purchase', 'inventory'] },
      ],
    },
    {
      section: 'Sales & Procurement',
      items: [
        { path: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart, roles: ['admin', 'sales', 'inventory', 'finance'] },
        { path: '/purchase-orders', label: 'Purchase Orders', icon: Truck, roles: ['admin', 'purchase', 'inventory'] },
        { path: '/grn', label: 'Goods Receipt (GRN)', icon: FileCheck, roles: ['admin', 'inventory', 'purchase'] },
      ],
    },
    {
      section: 'Finance & Billing',
      items: [
        { path: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'sales', 'finance'] },
      ],
    },
    {
      section: 'Administration',
      items: [
        { path: '/admin/users', label: 'User Management', icon: ShieldCheck, roles: ['admin'] },
        { path: '/docs', label: 'API Explorer', icon: Code2, roles: ['admin', 'sales', 'purchase', 'inventory', 'finance'] },
      ],
    },
  ];

  return (
    <aside className={`erp-sidebar ${collapsed ? 'erp-sidebar-collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-logo">
          <Layers size={22} />
        </div>
        {!collapsed && (
          <div className="d-flex flex-column" style={{ minWidth: 0 }}>
            <span className="fw-bold text-white fs-6 text-truncate" style={{ letterSpacing: '-0.01em' }}>
              Apex ERP
            </span>
            <span className="text-secondary small text-truncate" style={{ fontSize: '0.72rem' }}>
              Enterprise Edition
            </span>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div className="nav-menu">
        {navItems.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => hasRole(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="mb-2">
              {!collapsed && (
                <div className="nav-section-title">
                  {group.section}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link-item ${isActive ? 'active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="text-truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;

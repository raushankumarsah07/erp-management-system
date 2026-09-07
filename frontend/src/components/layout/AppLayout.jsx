import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="erp-app-container">
      <Sidebar collapsed={collapsed} />
      <div className="erp-main-wrapper">
        <TopNavbar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

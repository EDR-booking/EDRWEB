import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 mt-16 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

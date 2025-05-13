import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaTicketAlt, 
  FaUsers, 
  FaChartLine, 
  FaConciergeBell,
  FaBuilding,
  FaMoneyBillWave,
  FaQrcode,
  FaExchangeAlt,
  FaFileAlt
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', icon: <FaHome className="mr-2" />, path: '/' },
    { name: 'Tickets', icon: <FaTicketAlt className="mr-2" />, path: '/tickets' },
    { name: 'Verify Ticket', icon: <FaQrcode className="mr-2" />, path: '/verify-ticket' },
    { name: 'Refund Ticket', icon: <FaExchangeAlt className="mr-2" />, path: '/refund-ticket' },
    { name: 'Users', icon: <FaUsers className="mr-2" />, path: '/users' },
    { name: 'Stations', icon: <FaBuilding className="mr-2" />, path: '/stations' },
    { name: 'Pricing', icon: <FaMoneyBillWave className="mr-2" />, path: '/pricing' },
    { name: 'Services', icon: <FaConciergeBell className="mr-2" />, path: '/services' },
    { name: 'Generate Report', icon: <FaFileAlt className="mr-2" />, path: '/generate-report' },
  ];

  return (
    <div className="h-screen bg-gray-800 text-white w-64 fixed left-0 top-0 overflow-y-auto">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-2xl font-bold">Train Admin</h2>
      </div>
      <nav className="mt-5">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                to={item.path}
                className={`flex items-center px-5 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                  location.pathname === item.path ? 'bg-gray-700 text-white' : ''
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

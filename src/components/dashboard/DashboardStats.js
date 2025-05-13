import React from 'react';
import { FaTicketAlt, FaUsers, FaTrain, FaRoute } from 'react-icons/fa';

const StatsCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-5 flex items-center">
    <div className={`rounded-full p-3 mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const DashboardStats = ({ stats }) => {
  // Default values in case stats aren't provided
  const defaultStats = {
    totalTickets: '0',
    totalUsers: '0',
    totalTrains: '0',
    totalRoutes: '0'
  };

  const { totalTickets, totalUsers, totalTrains, totalRoutes } = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard 
        title="Total Tickets" 
        value={totalTickets} 
        icon={<FaTicketAlt className="text-white text-xl" />} 
        color="bg-blue-500" 
      />
      <StatsCard 
        title="Total Users" 
        value={totalUsers} 
        icon={<FaUsers className="text-white text-xl" />} 
        color="bg-green-500" 
      />
      <StatsCard 
        title="Active Trains" 
        value={totalTrains} 
        icon={<FaTrain className="text-white text-xl" />} 
        color="bg-purple-500" 
      />
      <StatsCard 
        title="Total Routes" 
        value={totalRoutes} 
        icon={<FaRoute className="text-white text-xl" />} 
        color="bg-orange-500" 
      />
    </div>
  );
};

export default DashboardStats;

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Sample data - this would come from Firestore in the real app
const sampleData = [
  { name: 'Jan', tickets: 65, users: 42 },
  { name: 'Feb', tickets: 59, users: 38 },
  { name: 'Mar', tickets: 80, users: 55 },
  { name: 'Apr', tickets: 81, users: 60 },
  { name: 'May', tickets: 56, users: 45 },
  { name: 'Jun', tickets: 55, users: 48 },
  { name: 'Jul', tickets: 40, users: 30 },
];

const DashboardChart = ({ data }) => {
  // Use provided data or sample data
  const chartData = data || sampleData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Ticket Bookings Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="tickets"
              stroke="#3B82F6"
              activeDot={{ r: 8 }}
              name="Tickets Booked"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#10B981"
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Monthly Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tickets" fill="#3B82F6" name="Tickets Booked" />
            <Bar dataKey="users" fill="#10B981" name="Active Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChart;

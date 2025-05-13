import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardChart from '../components/dashboard/DashboardChart';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats (in a real app, you might have a specific stats collection)
        const statsData = {
          totalTickets: '156',
          totalUsers: '78',
          totalTrains: '12',
          totalRoutes: '24'
        };
        setStats(statsData);

        // Fetch recent tickets
        const ticketsQuery = query(
          collection(db, 'tickets'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsList = ticketsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentTickets(ticketsList);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      <DashboardStats stats={stats} />
      <DashboardChart />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Ticket Bookings</h2>
        
        {recentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Ticket ID</th>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-left">Route</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{ticket.id ? ticket.id.substring(0, 8) : 'N/A'}</td>
                    <td className="py-3 px-4">{ticket.userName || 'Unknown'}</td>
                    <td className="py-3 px-4">{ticket.routeName || 'Unknown'}</td>
                    <td className="py-3 px-4">
                      {ticket.date 
                        ? (typeof ticket.date.toDate === 'function' 
                            ? new Date(ticket.date.toDate()).toLocaleDateString() 
                            : new Date(ticket.date).toLocaleDateString())
                        : 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : ticket.status === 'cancelled' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {ticket.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent tickets found</p>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebase';
import { FaSearch, FaCalendarAlt, FaExchangeAlt } from 'react-icons/fa';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripDirection, setTripDirection] = useState('all');
  const [imageLoading, setImageLoading] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        
        // Create date range for the selected date (start and end of day)
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Build query based on filters
        let bookingsQuery = query(
          collection(db, 'bookings'),
          where('bookingDate', '>=', Timestamp.fromDate(startDate)),
          where('bookingDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('bookingDate', 'desc')
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        let bookingsList = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter by trip direction if needed
        if (tripDirection !== 'all') {
          bookingsList = bookingsList.filter(booking => 
            booking.tripDirection === tripDirection
          );
        }
        
        setBookings(bookingsList);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate, tripDirection]);

  // Function to load kebele ID image URL
  const loadKebeleImage = async (booking) => {
    if (!booking.kebeleIdPath || imageLoading[booking.id]) return;
    
    try {
      setImageLoading(prev => ({ ...prev, [booking.id]: true }));
      const imageRef = ref(storage, booking.kebeleIdPath);
      const url = await getDownloadURL(imageRef);
      
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === booking.id ? { ...b, kebeleIdUrl: url } : b
        )
      );
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setImageLoading(prev => ({ ...prev, [booking.id]: false }));
    }
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => 
    booking.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.selectedRoute?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.citizenship?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View kebele ID image
  const viewKebeleId = (booking) => {
    if (booking.kebeleIdUrl) {
      window.open(booking.kebeleIdUrl, '_blank');
    } else if (booking.kebeleIdPath) {
      loadKebeleImage(booking);
    }
  };

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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Passenger Bookings</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="relative">
              <FaExchangeAlt className="absolute left-3 top-3 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tripDirection}
                onChange={(e) => setTripDirection(e.target.value)}
              >
                <option value="all">All Directions</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">Passenger Name</th>
                    <th className="py-3 px-4 text-left">Selected Route</th>
                    <th className="py-3 px-4 text-left">Citizenship</th>
                    <th className="py-3 px-4 text-left">Ticket Price (ETB)</th>
                    <th className="py-3 px-4 text-left">Booking Date</th>
                    <th className="py-3 px-4 text-left">Kebele ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{booking.passengerName || 'Unknown'}</td>
                      <td className="py-3 px-4">{booking.selectedRoute || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span 
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            booking.citizenship === 'Ethiopian' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.citizenship || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{booking.ticketPrice || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {booking.bookingDate ? 
                          new Date(booking.bookingDate.toDate()).toLocaleString() : 
                          'Unknown'
                        }
                      </td>
                      <td className="py-3 px-4">
                        {booking.citizenship === 'Ethiopian' && booking.kebeleIdPath ? (
                          <button
                            onClick={() => viewKebeleId(booking)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            disabled={imageLoading[booking.id]}
                          >
                            {imageLoading[booking.id] ? 'Loading...' : 'View ID'}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No bookings found for the selected date and filters
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;

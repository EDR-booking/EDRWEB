import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaDownload, FaSpinner } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const GenerateReport = () => {
  const [reportType, setReportType] = useState('ticket-sales');
  const [dateRange, setDateRange] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const formattedToday = formatDateForInput(today);
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const formattedLastMonth = formatDateForInput(lastMonth);
    
    setEndDate(formattedToday);
    setStartDate(formattedLastMonth);
  }, []);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    
    try {
      let start, end;
      
      // Handle predefined date ranges
      if (dateRange !== 'custom') {
        const now = new Date();
        end = now;
        
        switch (dateRange) {
          case 'daily':
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            start = new Date(now);
            start.setDate(now.getDate() - 7);
            break;
          case 'monthly':
            start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            break;
          case 'yearly':
            start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            break;
          default:
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
        }
      } else {
        // Custom date range
        if (!startDate || !endDate) {
          throw new Error('Please select both start and end dates');
        }
        
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day
      }
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);
      
      let reportResult;
      
      switch (reportType) {
        case 'ticket-sales':
          reportResult = await generateTicketSalesReport(startTimestamp, endTimestamp);
          break;
        case 'revenue':
          reportResult = await generateRevenueReport(startTimestamp, endTimestamp);
          break;
        case 'refunds':
          reportResult = await generateRefundsReport(startTimestamp, endTimestamp);
          break;
        default:
          reportResult = await generateTicketSalesReport(startTimestamp, endTimestamp);
      }
      
      setReportData(reportResult);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateTicketSalesReport = async (startTimestamp, endTimestamp) => {
    // Query tickets collection for the specified date range
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Process ticket data
    const tickets = [];
    let totalTickets = 0;
    let verifiedTickets = 0;
    let unverifiedTickets = 0;
    
    querySnapshot.forEach((doc) => {
      const ticket = {
        id: doc.id,
        ...doc.data()
      };
      
      tickets.push(ticket);
      totalTickets++;
      
      if (ticket.verified) {
        verifiedTickets++;
      } else {
        unverifiedTickets++;
      }
    });
    
    return {
      type: 'Ticket Sales Report',
      startDate: startTimestamp.toDate(),
      endDate: endTimestamp.toDate(),
      totalTickets,
      verifiedTickets,
      unverifiedTickets,
      tickets
    };
  };

  const generateRevenueReport = async (startTimestamp, endTimestamp) => {
    // Query tickets collection for the specified date range
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Process revenue data
    let totalRevenue = 0;
    let refundedRevenue = 0;
    let netRevenue = 0;
    const revenueByClass = {};
    const revenueByRoute = {};
    
    querySnapshot.forEach((doc) => {
      const ticket = doc.data();
      const price = ticket.price || 0;
      
      if (!ticket.refunded) {
        totalRevenue += price;
        
        // Group by class
        const ticketClass = ticket.class || 'Unknown';
        revenueByClass[ticketClass] = (revenueByClass[ticketClass] || 0) + price;
        
        // Group by route
        const route = `${ticket.from || 'Unknown'} to ${ticket.to || 'Unknown'}`;
        revenueByRoute[route] = (revenueByRoute[route] || 0) + price;
      } else {
        refundedRevenue += price;
      }
    });
    
    netRevenue = totalRevenue - refundedRevenue;
    
    return {
      type: 'Revenue Report',
      startDate: startTimestamp.toDate(),
      endDate: endTimestamp.toDate(),
      totalRevenue,
      refundedRevenue,
      netRevenue,
      revenueByClass,
      revenueByRoute
    };
  };

  const generateRefundsReport = async (startTimestamp, endTimestamp) => {
    // Query tickets collection for refunded tickets in the specified date range
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('refunded', '==', true),
      where('refundedAt', '>=', startTimestamp),
      where('refundedAt', '<=', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Process refund data
    const refunds = [];
    let totalRefunds = 0;
    let totalRefundAmount = 0;
    const refundsByReason = {};
    
    querySnapshot.forEach((doc) => {
      const ticket = {
        id: doc.id,
        ...doc.data()
      };
      
      refunds.push(ticket);
      totalRefunds++;
      totalRefundAmount += ticket.price || 0;
      
      // Group by reason
      const reason = ticket.refundReason || 'Unknown';
      refundsByReason[reason] = (refundsByReason[reason] || 0) + 1;
    });
    
    return {
      type: 'Refunds Report',
      startDate: startTimestamp.toDate(),
      endDate: endTimestamp.toDate(),
      totalRefunds,
      totalRefundAmount,
      refundsByReason,
      refunds
    };
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    // Convert report data to CSV or JSON
    const reportJson = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.type.replace(/\s+/g, '-').toLowerCase()}-${formatDateForInput(reportData.startDate)}-to-${formatDateForInput(reportData.endDate)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const renderReportForm = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="ticket-sales">Ticket Sales</option>
            <option value="revenue">Revenue</option>
            <option value="refunds">Refunds</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="yearly">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}
        
        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
        >
          {loading ? (
            <>
              <FaSpinner className="mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FaFileAlt className="mr-2" />
              Generate Report
            </>
          )}
        </button>
      </div>
    );
  };

  const renderReportResults = () => {
    if (!reportData) return null;
    
    let reportContent;
    
    switch (reportType) {
      case 'ticket-sales':
        reportContent = (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Summary</h3>
              <p>Total Tickets: <span className="font-bold">{reportData.totalTickets}</span></p>
              <p>Verified Tickets: <span className="font-bold">{reportData.verifiedTickets}</span></p>
              <p>Unverified Tickets: <span className="font-bold">{reportData.unverifiedTickets}</span></p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Ticket Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Ticket ID</th>
                      <th className="py-3 px-6 text-left">Passenger</th>
                      <th className="py-3 px-6 text-left">Route</th>
                      <th className="py-3 px-6 text-left">Date</th>
                      <th className="py-3 px-6 text-left">Price</th>
                      <th className="py-3 px-6 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {reportData.tickets.slice(0, 10).map((ticket) => (
                      <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6">{ticket.id.substring(0, 8)}...</td>
                        <td className="py-3 px-6">{ticket.passengerName || 'N/A'}</td>
                        <td className="py-3 px-6">{`${ticket.from || 'N/A'} to ${ticket.to || 'N/A'}`}</td>
                        <td className="py-3 px-6">
                          {ticket.date ? new Date(ticket.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-6">${ticket.price || 0}</td>
                        <td className="py-3 px-6">
                          {ticket.refunded ? (
                            <span className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-xs">Refunded</span>
                          ) : ticket.verified ? (
                            <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">Verified</span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-xs">Unverified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.tickets.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing 10 of {reportData.tickets.length} tickets. Download the report to see all data.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
        break;
        
      case 'revenue':
        reportContent = (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Revenue Summary</h3>
              <p>Total Revenue: <span className="font-bold">${reportData.totalRevenue}</span></p>
              <p>Refunded Amount: <span className="font-bold">${reportData.refundedRevenue}</span></p>
              <p>Net Revenue: <span className="font-bold">${reportData.netRevenue}</span></p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Revenue by Class</h3>
                <div className="bg-white p-4 rounded-lg shadow">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Class</th>
                        <th className="py-3 px-6 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {Object.entries(reportData.revenueByClass).map(([className, amount]) => (
                        <tr key={className} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="py-3 px-6">{className}</td>
                          <td className="py-3 px-6 text-right">${amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Revenue by Route</h3>
                <div className="bg-white p-4 rounded-lg shadow">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Route</th>
                        <th className="py-3 px-6 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {Object.entries(reportData.revenueByRoute).map(([route, amount]) => (
                        <tr key={route} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="py-3 px-6">{route}</td>
                          <td className="py-3 px-6 text-right">${amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
        break;
        
      case 'refunds':
        reportContent = (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Refunds Summary</h3>
              <p>Total Refunds: <span className="font-bold">{reportData.totalRefunds}</span></p>
              <p>Total Refund Amount: <span className="font-bold">${reportData.totalRefundAmount}</span></p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Refunds by Reason</h3>
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Reason</th>
                      <th className="py-3 px-6 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {Object.entries(reportData.refundsByReason).map(([reason, count]) => (
                      <tr key={reason} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6">{reason}</td>
                        <td className="py-3 px-6 text-right">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Refund Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Ticket ID</th>
                      <th className="py-3 px-6 text-left">Passenger</th>
                      <th className="py-3 px-6 text-left">Refund Date</th>
                      <th className="py-3 px-6 text-left">Amount</th>
                      <th className="py-3 px-6 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {reportData.refunds.slice(0, 10).map((refund) => (
                      <tr key={refund.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-6">{refund.id.substring(0, 8)}...</td>
                        <td className="py-3 px-6">{refund.passengerName || 'N/A'}</td>
                        <td className="py-3 px-6">
                          {refund.refundedAt ? new Date(refund.refundedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-6">${refund.price || 0}</td>
                        <td className="py-3 px-6">{refund.refundReason || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.refunds.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing 10 of {reportData.refunds.length} refunds. Download the report to see all data.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
        break;
        
      default:
        reportContent = <p>No report data available</p>;
    }
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{reportData.type}</h2>
          <button
            onClick={downloadReport}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center"
          >
            <FaDownload className="mr-2" />
            Download
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>
            Period: {reportData.startDate.toLocaleDateString()} to {reportData.endDate.toLocaleDateString()}
          </p>
        </div>
        
        {reportContent}
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Generate Report</h1>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {renderReportForm()}
        
        {reportData && renderReportResults()}
      </div>
    </Layout>
  );
};

export default GenerateReport;

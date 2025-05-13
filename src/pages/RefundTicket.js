import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { FaQrcode, FaExchangeAlt, FaTimes, FaCheck } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const RefundTicket = () => {
  const [scanning, setScanning] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  const handleScan = async (data) => {
    if (data && data.text) {
      setScanning(false);
      setLoading(true);
      setError(null);
      
      try {
        // Parse the QR code data
        const ticketId = JSON.parse(data.text).ticketId;
        
        if (!ticketId) {
          throw new Error('Invalid QR code format');
        }
        
        // Fetch ticket data from Firestore
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (!ticketSnap.exists()) {
          throw new Error('Ticket not found');
        }
        
        const ticket = ticketSnap.data();
        setTicketData({
          id: ticketId,
          ...ticket
        });
        
        // Check if ticket is already refunded
        if (ticket.refunded) {
          setRefundStatus('already-refunded');
        } 
        // Check if ticket is used/verified
        else if (ticket.verified) {
          setRefundStatus('already-used');
        }
        // Check if the journey date has passed
        else if (ticket.date && ticket.date.seconds * 1000 < Date.now()) {
          setRefundStatus('expired');
        }
        else {
          setRefundStatus('eligible');
        }
        
      } catch (err) {
        console.error('Error processing ticket:', err);
        setError(err.message || 'Failed to process ticket');
        setTicketData(null);
        setRefundStatus('invalid');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Error accessing camera');
    setScanning(false);
  };

  const processRefund = async () => {
    if (!ticketData || !ticketData.id || !refundReason) {
      setError('Please provide a reason for refund');
      return;
    }
    
    setLoading(true);
    try {
      const ticketRef = doc(db, 'tickets', ticketData.id);
      await updateDoc(ticketRef, {
        refunded: true,
        refundedAt: Timestamp.now(),
        refundedBy: 'admin', // You might want to get the actual admin user ID here
        refundReason: refundReason
      });
      
      setRefundStatus('refunded');
    } catch (err) {
      console.error('Error processing refund:', err);
      setError('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setTicketData(null);
    setError(null);
    setRefundStatus(null);
    setRefundReason('');
  };

  const renderTicketDetails = () => {
    if (!ticketData) return null;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Ticket Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Ticket ID</p>
            <p className="font-medium">{ticketData.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Passenger Name</p>
            <p className="font-medium">{ticketData.passengerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">From</p>
            <p className="font-medium">{ticketData.from || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">To</p>
            <p className="font-medium">{ticketData.to || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Date</p>
            <p className="font-medium">
              {ticketData.date ? new Date(ticketData.date.seconds * 1000).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Seat</p>
            <p className="font-medium">{ticketData.seat || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Class</p>
            <p className="font-medium">{ticketData.class || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Price</p>
            <p className="font-medium">{ticketData.price ? `$${ticketData.price}` : 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRefundStatus = () => {
    if (!refundStatus) return null;
    
    let statusContent;
    
    switch (refundStatus) {
      case 'eligible':
        statusContent = (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-4 flex items-center">
            <FaCheck className="mr-2" />
            <span>Ticket is eligible for refund.</span>
          </div>
        );
        break;
      case 'refunded':
        statusContent = (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4 flex items-center">
            <FaCheck className="mr-2" />
            <span>Refund processed successfully!</span>
          </div>
        );
        break;
      case 'already-refunded':
        statusContent = (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 flex items-center">
            <FaExchangeAlt className="mr-2" />
            <span>This ticket has already been refunded.</span>
          </div>
        );
        break;
      case 'already-used':
        statusContent = (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 flex items-center">
            <FaTimes className="mr-2" />
            <span>This ticket has already been used and cannot be refunded.</span>
          </div>
        );
        break;
      case 'expired':
        statusContent = (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 flex items-center">
            <FaTimes className="mr-2" />
            <span>This ticket has expired and cannot be refunded.</span>
          </div>
        );
        break;
      case 'invalid':
        statusContent = (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 flex items-center">
            <FaTimes className="mr-2" />
            <span>Invalid ticket.</span>
          </div>
        );
        break;
      default:
        statusContent = null;
    }
    
    return statusContent;
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Refund Ticket</h1>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {renderRefundStatus()}
        
        {scanning ? (
          <div className="mb-6">
            <div className="max-w-md mx-auto">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={handleScan}
                onError={handleError}
                style={{ width: '100%' }}
              />
              <button
                onClick={() => setScanning(false)}
                className="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={startScanning}
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
            >
              <FaQrcode className="mr-2" />
              Scan QR Code
            </button>
          </div>
        )}
        
        {ticketData && (
          <div className="mb-6">
            {renderTicketDetails()}
            
            {refundStatus === 'eligible' && (
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Reason for Refund</label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Customer request">Customer request</option>
                    <option value="Train cancelled">Train cancelled</option>
                    <option value="Train delayed">Train delayed</option>
                    <option value="Duplicate booking">Duplicate booking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <button
                  onClick={processRefund}
                  disabled={loading || !refundReason}
                  className={`mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center ${
                    !refundReason ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaExchangeAlt className="mr-2" />
                  Process Refund
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RefundTicket;

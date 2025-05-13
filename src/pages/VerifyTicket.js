import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { FaCheck, FaTimes, FaQrcode } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const VerifyTicket = () => {
  const [scanning, setScanning] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

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
        
        // Check if ticket is already verified
        if (ticket.verified) {
          setVerificationStatus('already-verified');
        } else {
          setVerificationStatus('valid');
        }
        
      } catch (err) {
        console.error('Error verifying ticket:', err);
        setError(err.message || 'Failed to verify ticket');
        setTicketData(null);
        setVerificationStatus('invalid');
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

  const verifyTicket = async () => {
    if (!ticketData || !ticketData.id) return;
    
    setLoading(true);
    try {
      const ticketRef = doc(db, 'tickets', ticketData.id);
      await updateDoc(ticketRef, {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: 'admin' // You might want to get the actual admin user ID here
      });
      
      setVerificationStatus('verified');
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setTicketData(null);
    setError(null);
    setVerificationStatus(null);
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

  const renderVerificationStatus = () => {
    if (!verificationStatus) return null;
    
    let statusContent;
    
    switch (verificationStatus) {
      case 'valid':
        statusContent = (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-4 flex items-center">
            <FaCheck className="mr-2" />
            <span>Valid ticket. Ready to verify.</span>
          </div>
        );
        break;
      case 'verified':
        statusContent = (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4 flex items-center">
            <FaCheck className="mr-2" />
            <span>Ticket successfully verified!</span>
          </div>
        );
        break;
      case 'already-verified':
        statusContent = (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 flex items-center">
            <FaCheck className="mr-2" />
            <span>This ticket has already been verified.</span>
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
        <h1 className="text-2xl font-bold mb-6">Verify Ticket</h1>
        
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {renderVerificationStatus()}
        
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
            
            {verificationStatus === 'valid' && (
              <button
                onClick={verifyTicket}
                disabled={loading}
                className="mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center"
              >
                <FaCheck className="mr-2" />
                Verify Ticket
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifyTicket;

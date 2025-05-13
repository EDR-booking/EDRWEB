import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { collection, getDocs, doc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaImage } from 'react-icons/fa';
import ServiceForm from '../components/services/ServiceForm';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [stations, setStations] = useState([]);
  const [debugMessage, setDebugMessage] = useState('');

  useEffect(() => {
    fetchServices();
    fetchStations();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesQuery = query(
        collection(db, 'services'),
        orderBy('createdAt', 'desc')
      );
      
      // For development, create sample data if Firestore isn't connected
      const isDevelopmentMode = false;
      
      if (isDevelopmentMode) {
        // Sample service data for development
        const sampleServices = [
          {
            id: '1',
            title: 'Station Café',
            description: 'Cozy café serving fresh coffee and pastries, perfect for a quick pre-journey snack.',
            category: 'Dining',
            stationId: 'sebeta-station',
            stationName: 'Sebeta',
            distanceFromStation: '50m',
            phoneNumber: '+1234567890',
            alternativePhone: '',
            email: 'info@stationcafe.com',
            rating: 4.5,
            imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=600&q=60',
            createdAt: new Date()
          },
          {
            id: '2',
            title: 'Express Cab Service',
            description: 'Reliable taxi service available 24/7 at competitive rates.',
            category: 'Transportation',
            stationId: 'lebu-station',
            stationName: 'Lebu',
            distanceFromStation: '10m',
            phoneNumber: '+1987654321',
            alternativePhone: '+1555666777',
            email: 'booking@expresscab.com',
            rating: 4.2,
            imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=600&q=60',
            createdAt: new Date()
          },
          {
            id: '3',
            title: 'Station Hotel',
            description: 'Comfortable hotel located right across from the station, offering special rates for train passengers.',
            category: 'Accommodation',
            stationId: 'bishoftu-station',
            stationName: 'Bishoftu',
            distanceFromStation: '100m',
            phoneNumber: '+1122334455',
            alternativePhone: '',
            email: 'reservations@stationhotel.com',
            rating: 4.7,
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG90ZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=60',
            createdAt: new Date()
          }
        ];
        setServices(sampleServices);
        setLoading(false);
        return;
      }
      
      const servicesSnapshot = await getDocs(servicesQuery);
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      // Define the official Ethiopian railway stations
      const officialStationIds = [
        'sebeta-station',  // Sebeta
        'lebu-station',    // Lebu
        'bishoftu-station', // Bishoftu
        'mojo-station',    // Mojo
        'adama-station',   // Adama
        'bike-station',    // Bike
        'mieso-station',   // Mieso
        'dire-dawa-station' // Dire Dawa
      ];
      
      const stationsQuery = query(
        collection(db, 'stations'),
        orderBy('name', 'asc')
      );
      
      // For development, create sample data if Firestore isn't connected
      const isDevelopmentMode = false;
      
      if (isDevelopmentMode) {
        // Sample station data for development
        const sampleStations = [
          { id: 'sebeta-station', name: 'Sebeta' },
          { id: 'lebu-station', name: 'Lebu' },
          { id: 'bishoftu-station', name: 'Bishoftu' },
          { id: 'mojo-station', name: 'Mojo' },
          { id: 'adama-station', name: 'Adama' },
          { id: 'bike-station', name: 'Bike' },
          { id: 'mieso-station', name: 'Mieso' },
          { id: 'dire-dawa-station', name: 'Dire Dawa' }
        ];
        setStations(sampleStations);
        return;
      }
      
      // Check if there are stations in Firestore
      const stationsSnapshot = await getDocs(stationsQuery);
      if (stationsSnapshot.empty) {
        // If no stations exist in Firestore, use the Ethiopian railway stations
        const ethiopianStations = [
          { id: 'sebeta-station', name: 'Sebeta' },
          { id: 'lebu-station', name: 'Lebu' },
          { id: 'bishoftu-station', name: 'Bishoftu' },
          { id: 'mojo-station', name: 'Mojo' },
          { id: 'adama-station', name: 'Adama' },
          { id: 'bike-station', name: 'Bike' },
          { id: 'mieso-station', name: 'Mieso' },
          { id: 'dire-dawa-station', name: 'Dire Dawa' }
        ];
        setStations(ethiopianStations);
        
        // Optionally, you can save these stations to Firestore for future use
        ethiopianStations.forEach(async (station) => {
          try {
            await addDoc(collection(db, 'stations'), station);
          } catch (error) {
            console.error('Error saving station:', error);
          }
        });
        
        return;
      }
      
      // Use stations from Firestore, but filter to only include official stations
      const stationsList = stationsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(station => officialStationIds.includes(station.id));
      
      setStations(stationsList);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Test Firestore connectivity
  const testFirestoreConnection = async () => {
    setDebugMessage('Testing Firestore connection...');
    try {
      // Try to add a test document
      const testDoc = {
        title: 'Test Service',
        description: 'This is a test to verify Firestore connectivity',
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'services'), testDoc);
      setDebugMessage(`Success! Test document added with ID: ${docRef.id}`);
      
      // Clean up by deleting the test document
      await deleteDoc(doc(db, 'services', docRef.id));
      setDebugMessage(`Test complete. Document added and deleted successfully.`);
    } catch (error) {
      setDebugMessage(`Firestore Error: ${error.message}`);
      console.error('Firestore test error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service recommendation?')) {
      try {
        // For development, just remove from local state
        const isDevelopmentMode = false;
        
        if (isDevelopmentMode) {
          setServices(services.filter(service => service.id !== id));
          return;
        }
        
        await deleteDoc(doc(db, 'services', id));
        setServices(services.filter(service => service.id !== id));
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleEdit = (service) => {
    setCurrentService(service);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setCurrentService(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setCurrentService(null);
  };

  const handleServiceSaved = (newService) => {
    if (currentService) {
      // Update existing service in the list
      setServices(services.map(service => 
        service.id === newService.id ? newService : service
      ));
    } else {
      // Add new service to the list
      setServices([newService, ...services]);
    }
    setShowForm(false);
    setCurrentService(null);
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.stationName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Service Recommendations</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add New Service
          </button>
          <button
            onClick={testFirestoreConnection}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Test Firestore
          </button>
        </div>
      </div>

      {showForm && (
        <ServiceForm 
          service={currentService} 
          stations={stations}
          onClose={handleFormClose}
          onSave={handleServiceSaved}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredServices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Image</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Station</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Distance</th>
                  <th className="py-3 px-4 text-left">Contact</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {service.imageUrl ? (
                        <img 
                          src={service.imageUrl} 
                          alt={service.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <FaImage className="text-gray-400 text-xl" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{service.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{service.description}</div>
                    </td>
                    <td className="py-3 px-4">{service.stationName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">{service.distanceFromStation}</td>
                    <td className="py-3 px-4">
                      {service.phoneNumber && <div>{service.phoneNumber}</div>}
                      {service.email && <div className="text-xs text-gray-500">{service.email}</div>}
                      {!service.phoneNumber && !service.email && <div className="text-xs text-gray-500">No contact info</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(service)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No service recommendations found matching your search criteria
          </div>
        )}
      </div>
      <div className="mt-4 text-gray-500">{debugMessage}</div>
    </Layout>
  );
};

export default Services;

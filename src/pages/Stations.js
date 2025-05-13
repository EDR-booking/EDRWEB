import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPlus } from 'react-icons/fa';
import StationForm from '../components/stations/StationForm';

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Define the official Ethiopian railway stations
  const officialStations = [
    { id: 'sebeta-station', name: 'Sebeta' },
    { id: 'lebu-station', name: 'Lebu' },
    { id: 'bishoftu-station', name: 'Bishoftu' },
    { id: 'mojo-station', name: 'Mojo' },
    { id: 'adama-station', name: 'Adama' },
    { id: 'bike-station', name: 'Bike' },
    { id: 'mieso-station', name: 'Mieso' },
    { id: 'dire-dawa-station', name: 'Dire Dawa' }
  ];

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      
      // Get current status of all stations from Firestore
      const stationsData = {};
      const stationsSnapshot = await getDocs(collection(db, 'stations'));
      
      stationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        stationsData[doc.id] = {
          ...data,
          id: doc.id
        };
      });
      
      // Create or update all official stations
      const stationsList = [];
      
      for (const station of officialStations) {
        let stationData;
        
        if (stationsData[station.id]) {
          // Use existing data if available
          stationData = stationsData[station.id];
        } else {
          // Create new station with default values
          stationData = {
            id: station.id,
            name: station.name,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Save to Firestore
          await setDoc(doc(db, 'stations', station.id), {
            name: station.name,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        stationsList.push(stationData);
      }
      
      // Sort alphabetically
      stationsList.sort((a, b) => a.name.localeCompare(b.name));
      setStations(stationsList);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (station) => {
    try {
      const newActiveState = !station.active;
      const stationRef = doc(db, 'stations', station.id);
      
      // Update in Firestore
      await updateDoc(stationRef, {
        active: newActiveState,
        updatedAt: serverTimestamp()
      });
      
      // Update local state immediately
      setStations(prevStations => 
        prevStations.map(s => 
          s.id === station.id 
            ? { ...s, active: newActiveState, updatedAt: new Date() } 
            : s
        )
      );
      
      console.log(`Station ${station.name} active status set to: ${newActiveState}`);
    } catch (error) {
      console.error('Error toggling station status:', error);
      alert(`Failed to update ${station.name} status: ${error.message}`);
    }
  };

  const handleEdit = (station) => {
    setCurrentStation(station);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'stations', id));
        setStations(stations.filter(station => station.id !== id));
      } catch (error) {
        console.error('Error deleting station:', error);
        alert('Failed to delete station');
      }
    }
  };

  const handleAddNew = () => {
    setCurrentStation(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setCurrentStation(null);
  };

  const handleStationSaved = (newStation) => {
    if (currentStation) {
      // Update existing station in the list
      setStations(stations.map(station => 
        station.id === newStation.id ? newStation : station
      ));
    } else {
      // Add new station to the list
      setStations([...stations, newStation]);
    }
    setShowForm(false);
    setCurrentStation(null);
  };

  // Filter stations based on search term
  const filteredStations = stations.filter(station => 
    station.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-semibold">Station Management</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stations..."
              className="px-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add New Station
          </button>
        </div>
      </div>

      {filteredStations.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((station) => (
                <tr key={station.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{station.name}</td>
                  <td className="py-3 px-4">
                    <span 
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        station.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {station.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(station)}
                        className={`p-1 rounded-full ${
                          station.active 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title={station.active ? 'Deactivate Station' : 'Activate Station'}
                      >
                        {station.active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                      </button>
                      <button
                        onClick={() => handleEdit(station)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit Station"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(station.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete Station"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white shadow rounded-lg">
          <p className="text-gray-500">No stations found.</p>
        </div>
      )}

      {showForm && (
        <StationForm
          station={currentStation}
          onClose={handleFormClose}
          onSave={handleStationSaved}
        />
      )}
    </Layout>
  );
};

export default Stations;

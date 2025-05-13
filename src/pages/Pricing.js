import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaEdit, FaTrash, FaPlus, FaSync } from 'react-icons/fa';
import PriceForm from '../components/pricing/PriceForm';

const Pricing = () => {
  const [prices, setPrices] = useState([]);
  const [stations, setStations] = useState([]);
  const [orderedStations, setOrderedStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [filter, setFilter] = useState({
    origin: '',
    destination: ''
  });

  // Define the official station order for the Ethiopian railway
  const officialStationOrder = [
    'sebeta-station',  // Sebeta
    'lebu-station',    // Lebu
    'bishoftu-station', // Bishoftu
    'mojo-station',    // Mojo
    'adama-station',   // Adama
    'bike-station',    // Bike
    'mieso-station',   // Mieso
    'dire-dawa-station' // Dire Dawa
  ];

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (stations.length > 0) {
      organizeStationsInOrder();
      fetchPrices();
    }
  }, [stations]);

  const fetchStations = async () => {
    try {
      const stationsQuery = query(
        collection(db, 'stations'),
        orderBy('name', 'asc')
      );
      
      const stationsSnapshot = await getDocs(stationsQuery);
      const stationsList = stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Only include active stations
      setStations(stationsList.filter(station => station.active !== false));
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Organize stations according to the official railway line order
  const organizeStationsInOrder = () => {
    const stationsInOrder = [];
    
    // Add stations in the official order if they exist in our stations list
    for (const stationId of officialStationOrder) {
      const station = stations.find(s => s.id === stationId);
      if (station) {
        stationsInOrder.push(station);
      }
    }
    
    // Add any other stations that might not be in the official order
    stations.forEach(station => {
      if (!stationsInOrder.some(s => s.id === station.id)) {
        stationsInOrder.push(station);
      }
    });
    
    setOrderedStations(stationsInOrder);
  };

  const fetchPrices = async () => {
    try {
      const pricesQuery = query(
        collection(db, 'prices'),
        orderBy('updatedAt', 'desc')
      );
      
      const pricesSnapshot = await getDocs(pricesQuery);
      
      if (pricesSnapshot.empty) {
        // If no prices exist, we'll show an empty state
        setPrices([]);
      } else {
        const pricesList = pricesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPrices(pricesList);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate prices for all station combinations
  const generateAllPrices = async () => {
    if (window.confirm('This will create price entries for all station combinations. Continue?')) {
      setLoading(true);
      
      try {
        const newPrices = [];
        
        // Generate prices for all station combinations
        for (let i = 0; i < orderedStations.length; i++) {
          for (let j = 0; j < orderedStations.length; j++) {
            if (i !== j) { // Don't create prices for same origin and destination
              const originStation = orderedStations[i];
              const destStation = orderedStations[j];
              
              // Check if this price combination already exists
              const existingPrice = prices.find(
                p => p.originId === originStation.id && p.destinationId === destStation.id
              );
              
              if (!existingPrice) {
                // Calculate a simple distance-based price based on the position in the route
                // The farther apart stations are, the higher the price
                const originIndex = officialStationOrder.indexOf(originStation.id);
                const destIndex = officialStationOrder.indexOf(destStation.id);
                
                // If both stations are in the official order, use their positions
                // Otherwise use a default price
                let basePrice = 100; // Base price in ETB
                
                if (originIndex !== -1 && destIndex !== -1) {
                  const stationDistance = Math.abs(destIndex - originIndex);
                  basePrice = 50 + (stationDistance * 50); // 50 ETB per station
                }
                
                const priceData = {
                  originId: originStation.id,
                  originName: originStation.name,
                  destinationId: destStation.id,
                  destinationName: destStation.name,
                  // Regular seat prices
                  regularETH: basePrice,
                  regularDJI: Math.round(basePrice * 1.5),
                  regularFOR: Math.round(basePrice * 2),
                  // Bed - Lower prices (20% more than regular)
                  bedLowerETH: Math.round(basePrice * 1.2),
                  bedLowerDJI: Math.round(basePrice * 1.5 * 1.2),
                  bedLowerFOR: Math.round(basePrice * 2 * 1.2),
                  // Bed - Middle prices (10% more than regular)
                  bedMiddleETH: Math.round(basePrice * 1.1),
                  bedMiddleDJI: Math.round(basePrice * 1.5 * 1.1),
                  bedMiddleFOR: Math.round(basePrice * 2 * 1.1),
                  // Bed - Upper prices (same as regular)
                  bedUpperETH: basePrice,
                  bedUpperDJI: Math.round(basePrice * 1.5),
                  bedUpperFOR: Math.round(basePrice * 2),
                  // VIP - Lower prices (50% more than regular)
                  vipLowerETH: Math.round(basePrice * 1.5),
                  vipLowerDJI: Math.round(basePrice * 1.5 * 1.5),
                  vipLowerFOR: Math.round(basePrice * 2 * 1.5),
                  // VIP - Upper prices (30% more than regular)
                  vipUpperETH: Math.round(basePrice * 1.3),
                  vipUpperDJI: Math.round(basePrice * 1.5 * 1.3),
                  vipUpperFOR: Math.round(basePrice * 2 * 1.3),
                  // Common fields
                  currency: 'ETB',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                try {
                  const docRef = await addDoc(collection(db, 'prices'), priceData);
                  newPrices.push({
                    id: docRef.id,
                    ...priceData
                  });
                } catch (error) {
                  console.error('Error creating price:', error);
                }
              }
            }
          }
        }
        
        // Refresh the prices list with both existing and new prices
        setPrices([...prices, ...newPrices]);
        alert(`Created ${newPrices.length} new price entries.`);
      } catch (error) {
        console.error('Error generating prices:', error);
        alert('Failed to generate all prices.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (price) => {
    setCurrentPrice(price);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this price? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'prices', id));
        setPrices(prices.filter(price => price.id !== id));
      } catch (error) {
        console.error('Error deleting price:', error);
        alert('Failed to delete price');
      }
    }
  };

  const handleAddNew = () => {
    setCurrentPrice(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setCurrentPrice(null);
  };

  const handlePriceSaved = (newPrice) => {
    if (currentPrice) {
      // Update existing price in the list
      setPrices(prices.map(price => 
        price.id === newPrice.id ? newPrice : price
      ));
    } else {
      // Add new price to the list
      setPrices([newPrice, ...prices]);
    }
    setShowForm(false);
    setCurrentPrice(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter prices based on selected origin and destination
  const filteredPrices = prices.filter(price => {
    const originMatch = !filter.origin || price.originId === filter.origin;
    const destMatch = !filter.destination || price.destinationId === filter.destination;
    return originMatch && destMatch;
  });

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
        <h1 className="text-2xl font-semibold">Dynamic Pricing Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={generateAllPrices}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaSync className="mr-2" />
            Generate All Routes
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add New Price
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Route Information</h2>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Official Railway Line Order:</h3>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {orderedStations.map((station, index) => (
              <React.Fragment key={station.id}>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                  {station.name}
                </span>
                {index < orderedStations.length - 1 && (
                  <span className="text-gray-400">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <h2 className="text-lg font-medium mb-4">Filter Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origin Station
            </label>
            <select
              name="origin"
              value={filter.origin}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Origins</option>
              {orderedStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Station
            </label>
            <select
              name="destination"
              value={filter.destination}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Destinations</option>
              {orderedStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredPrices.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Regular Seat (ETB)
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Bed - Lower (ETB)
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Bed - Middle (ETB)
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Bed - Upper (ETB)
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    VIP - Lower (ETB)
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    VIP - Upper (ETB)
                  </th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="py-2 px-2"></th>
                  <th className="py-2 px-2"></th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2 text-xs text-center">ETH</th>
                  <th className="py-2 px-2 text-xs text-center">DJI</th>
                  <th className="py-2 px-2 text-xs text-center">FOR</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((price) => (
                  <tr key={price.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{price.originName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{price.destinationName}</div>
                    </td>
                    {/* Regular Seat */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.regularETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.regularDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.regularFOR?.toLocaleString() || '-'}
                    </td>
                    {/* Bed - Lower */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedLowerETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedLowerDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedLowerFOR?.toLocaleString() || '-'}
                    </td>
                    {/* Bed - Middle */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedMiddleETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedMiddleDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedMiddleFOR?.toLocaleString() || '-'}
                    </td>
                    {/* Bed - Upper */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedUpperETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedUpperDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.bedUpperFOR?.toLocaleString() || '-'}
                    </td>
                    {/* VIP - Lower */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipLowerETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipLowerDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipLowerFOR?.toLocaleString() || '-'}
                    </td>
                    {/* VIP - Upper */}
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipUpperETH?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipUpperDJI?.toLocaleString() || '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-sm">
                      {price.vipUpperFOR?.toLocaleString() || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(price)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit Price"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(price.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Price"
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
        </div>
      ) : (
        <div className="text-center py-8 bg-white shadow rounded-lg">
          <p className="text-gray-500">No prices found for the selected filter.</p>
          <button
            onClick={generateAllPrices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
          >
            Generate All Route Prices
          </button>
        </div>
      )}

      {showForm && (
        <PriceForm
          price={currentPrice}
          stations={orderedStations}
          onClose={handleFormClose}
          onSave={handlePriceSaved}
        />
      )}
    </Layout>
  );
};

export default Pricing;

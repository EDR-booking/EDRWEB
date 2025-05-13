import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes, FaChair, FaBed, FaCouch } from 'react-icons/fa';

const PriceForm = ({ price, stations, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    originId: '',
    originName: '',
    destinationId: '',
    destinationName: '',
    // Regular seat prices
    regularETH: '',
    regularDJI: '',
    regularFOR: '',
    // Bed - Lower prices
    bedLowerETH: '',
    bedLowerDJI: '',
    bedLowerFOR: '',
    // Bed - Middle prices
    bedMiddleETH: '',
    bedMiddleDJI: '',
    bedMiddleFOR: '',
    // Bed - Upper prices
    bedUpperETH: '',
    bedUpperDJI: '',
    bedUpperFOR: '',
    // VIP - Lower prices
    vipLowerETH: '',
    vipLowerDJI: '',
    vipLowerFOR: '',
    // VIP - Upper prices
    vipUpperETH: '',
    vipUpperDJI: '',
    vipUpperFOR: '',
    currency: 'ETB'  // Always ETB
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (price) {
      // Edit existing price
      setFormData({
        originId: price.originId || '',
        originName: price.originName || '',
        destinationId: price.destinationId || '',
        destinationName: price.destinationName || '',
        // Regular seat prices
        regularETH: price.regularETH?.toString() || '',
        regularDJI: price.regularDJI?.toString() || '',
        regularFOR: price.regularFOR?.toString() || '',
        // Bed - Lower prices
        bedLowerETH: price.bedLowerETH?.toString() || '',
        bedLowerDJI: price.bedLowerDJI?.toString() || '',
        bedLowerFOR: price.bedLowerFOR?.toString() || '',
        // Bed - Middle prices
        bedMiddleETH: price.bedMiddleETH?.toString() || '',
        bedMiddleDJI: price.bedMiddleDJI?.toString() || '',
        bedMiddleFOR: price.bedMiddleFOR?.toString() || '',
        // Bed - Upper prices
        bedUpperETH: price.bedUpperETH?.toString() || '',
        bedUpperDJI: price.bedUpperDJI?.toString() || '',
        bedUpperFOR: price.bedUpperFOR?.toString() || '',
        // VIP - Lower prices
        vipLowerETH: price.vipLowerETH?.toString() || '',
        vipLowerDJI: price.vipLowerDJI?.toString() || '',
        vipLowerFOR: price.vipLowerFOR?.toString() || '',
        // VIP - Upper prices
        vipUpperETH: price.vipUpperETH?.toString() || '',
        vipUpperDJI: price.vipUpperDJI?.toString() || '',
        vipUpperFOR: price.vipUpperFOR?.toString() || '',
        currency: 'ETB'  // Always ETB
      });
    } else if (stations.length > 0) {
      // New price, set default values
      const defaultOrigin = stations[0];
      const defaultDestination = stations.length > 1 ? stations[1] : stations[0];
      
      setFormData(prev => ({
        ...prev,
        originId: defaultOrigin.id,
        originName: defaultOrigin.name,
        destinationId: defaultDestination.id,
        destinationName: defaultDestination.name
      }));
    }
  }, [price, stations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For price fields, allow empty string or numbers
    if (name.startsWith('price')) {
      // Allow empty string or only numbers (including starting with 0)
      if (value === '' || /^\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleStationChange = (e) => {
    const { name, value } = e.target;
    const selectedStation = stations.find(station => station.id === value);
    
    if (name === 'originId') {
      setFormData(prev => ({
        ...prev,
        originId: value,
        originName: selectedStation ? selectedStation.name : ''
      }));
    } else if (name === 'destinationId') {
      setFormData(prev => ({
        ...prev,
        destinationId: value,
        destinationName: selectedStation ? selectedStation.name : ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.originId) {
      newErrors.originId = 'Origin station is required';
    }
    
    if (!formData.destinationId) {
      newErrors.destinationId = 'Destination station is required';
    }
    
    if (formData.originId === formData.destinationId) {
      newErrors.destinationId = 'Origin and destination cannot be the same';
    }
    
    // Define price fields to validate
    const priceFields = [
      'regularETH', 'regularDJI', 'regularFOR',
      'bedLowerETH', 'bedLowerDJI', 'bedLowerFOR',
      'bedMiddleETH', 'bedMiddleDJI', 'bedMiddleFOR',
      'bedUpperETH', 'bedUpperDJI', 'bedUpperFOR',
      'vipLowerETH', 'vipLowerDJI', 'vipLowerFOR',
      'vipUpperETH', 'vipUpperDJI', 'vipUpperFOR'
    ];
    
    // Validate each price field
    priceFields.forEach(field => {
      // Convert empty strings to 0 for validation
      const price = formData[field] === '' ? 0 : parseInt(formData[field], 10);
      
      if (price < 0) {
        newErrors[field] = 'Price cannot be negative';
      }
    });
    
    // Require at least one price to be filled
    const hasAnyPrice = priceFields.some(field => formData[field] !== '');
    if (!hasAnyPrice) {
      newErrors.general = 'At least one price must be provided';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Define price fields to process
      const priceFields = [
        'regularETH', 'regularDJI', 'regularFOR',
        'bedLowerETH', 'bedLowerDJI', 'bedLowerFOR',
        'bedMiddleETH', 'bedMiddleDJI', 'bedMiddleFOR',
        'bedUpperETH', 'bedUpperDJI', 'bedUpperFOR',
        'vipLowerETH', 'vipLowerDJI', 'vipLowerFOR',
        'vipUpperETH', 'vipUpperDJI', 'vipUpperFOR'
      ];
      
      // Convert price string values to numbers for database
      const finalData = {
        ...formData,
        currency: 'ETB'
      };
      
      // Process each price field
      priceFields.forEach(field => {
        finalData[field] = formData[field] === '' ? 0 : parseInt(formData[field], 10);
      });
      
      if (price) {
        // Update existing price
        const priceRef = doc(db, 'prices', price.id);
        await updateDoc(priceRef, {
          ...finalData,
          updatedAt: serverTimestamp()
        });
        
        onSave({
          ...finalData,
          id: price.id,
          createdAt: price.createdAt
        });
      } else {
        // Add new price
        const pricesCollection = collection(db, 'prices');
        const timestamp = serverTimestamp();
        
        const newPrice = {
          ...finalData,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        const docRef = await addDoc(pricesCollection, newPrice);
        
        onSave({
          ...finalData,
          id: docRef.id,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to save price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {price ? 'Edit Price' : 'Add New Price'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 flex-1">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin Station <span className="text-red-500">*</span>
              </label>
              <select
                name="originId"
                value={formData.originId}
                onChange={handleStationChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.originId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Origin</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              {errors.originId && (
                <p className="mt-1 text-sm text-red-500">{errors.originId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Station <span className="text-red-500">*</span>
              </label>
              <select
                name="destinationId"
                value={formData.destinationId}
                onChange={handleStationChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.destinationId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Destination</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              {errors.destinationId && (
                <p className="mt-1 text-sm text-red-500">{errors.destinationId}</p>
              )}
            </div>
          </div>
          
          {/* General error message if no prices provided */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errors.general}
            </div>
          )}

          {/* Regular Seats */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <FaChair className="text-gray-600 mr-2" />
              <h3 className="text-lg font-medium">Regular Seats</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ethiopian 🇪🇹
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="regularETH"
                    value={formData.regularETH}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.regularETH ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                    ETB
                  </div>
                </div>
                {errors.regularETH && (
                  <p className="mt-1 text-sm text-red-500">{errors.regularETH}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Djiboutian 🇩🇯
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="regularDJI"
                    value={formData.regularDJI}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.regularDJI ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                    ETB
                  </div>
                </div>
                {errors.regularDJI && (
                  <p className="mt-1 text-sm text-red-500">{errors.regularDJI}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Foreigner 🌍
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="regularFOR"
                    value={formData.regularFOR}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.regularFOR ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                    ETB
                  </div>
                </div>
                {errors.regularFOR && (
                  <p className="mt-1 text-sm text-red-500">{errors.regularFOR}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bed Seats */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <FaBed className="text-gray-600 mr-2" />
              <h3 className="text-lg font-medium">Bed Seats</h3>
            </div>
            
            {/* Lower Bed */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Lower</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ethiopian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedLowerETH"
                      value={formData.bedLowerETH}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedLowerETH ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedLowerETH && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedLowerETH}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Djiboutian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedLowerDJI"
                      value={formData.bedLowerDJI}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedLowerDJI ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedLowerDJI && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedLowerDJI}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foreigner
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedLowerFOR"
                      value={formData.bedLowerFOR}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedLowerFOR ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedLowerFOR && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedLowerFOR}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Middle Bed */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Middle</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ethiopian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedMiddleETH"
                      value={formData.bedMiddleETH}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedMiddleETH ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedMiddleETH && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedMiddleETH}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Djiboutian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedMiddleDJI"
                      value={formData.bedMiddleDJI}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedMiddleDJI ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedMiddleDJI && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedMiddleDJI}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foreigner
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedMiddleFOR"
                      value={formData.bedMiddleFOR}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedMiddleFOR ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedMiddleFOR && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedMiddleFOR}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Upper Bed */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Upper</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ethiopian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedUpperETH"
                      value={formData.bedUpperETH}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedUpperETH ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedUpperETH && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedUpperETH}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Djiboutian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedUpperDJI"
                      value={formData.bedUpperDJI}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedUpperDJI ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedUpperDJI && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedUpperDJI}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foreigner
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bedUpperFOR"
                      value={formData.bedUpperFOR}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bedUpperFOR ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.bedUpperFOR && (
                    <p className="mt-1 text-sm text-red-500">{errors.bedUpperFOR}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* VIP Seats */}
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <FaCouch className="text-gray-600 mr-2" />
              <h3 className="text-lg font-medium">VIP Seats</h3>
            </div>
            
            {/* Lower VIP */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Lower</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ethiopian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipLowerETH"
                      value={formData.vipLowerETH}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipLowerETH ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipLowerETH && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipLowerETH}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Djiboutian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipLowerDJI"
                      value={formData.vipLowerDJI}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipLowerDJI ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipLowerDJI && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipLowerDJI}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foreigner
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipLowerFOR"
                      value={formData.vipLowerFOR}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipLowerFOR ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipLowerFOR && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipLowerFOR}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Upper VIP */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Upper</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ethiopian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipUpperETH"
                      value={formData.vipUpperETH}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipUpperETH ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipUpperETH && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipUpperETH}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Djiboutian
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipUpperDJI"
                      value={formData.vipUpperDJI}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipUpperDJI ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipUpperDJI && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipUpperDJI}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foreigner
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="vipUpperFOR"
                      value={formData.vipUpperFOR}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.vipUpperFOR ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-500 border-r border-gray-300">
                      ETB
                    </div>
                  </div>
                  {errors.vipUpperFOR && (
                    <p className="mt-1 text-sm text-red-500">{errors.vipUpperFOR}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceForm;

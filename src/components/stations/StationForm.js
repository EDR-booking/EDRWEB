import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes } from 'react-icons/fa';

const StationForm = ({ station, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        active: station.active !== undefined ? station.active : true
      });
    }
  }, [station]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Station name is required';
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
      if (station) {
        // Update existing station
        const stationRef = doc(db, 'stations', station.id);
        await updateDoc(stationRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        onSave({
          ...formData,
          id: station.id
        });
      } else {
        // Add new station
        const stationsCollection = collection(db, 'stations');
        const timestamp = serverTimestamp();
        
        const newStation = {
          ...formData,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        const docRef = await addDoc(stationsCollection, newStation);
        
        onSave({
          ...formData,
          id: docRef.id
        });
      }
    } catch (error) {
      console.error('Error saving station:', error);
      alert('Failed to save station. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {station ? 'Edit Station' : 'Add New Station'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter station name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Station is Active
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Inactive stations will not be available for booking
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationForm;
